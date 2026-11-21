class DocumentService
  include MarkdownFrontmatter
  include Pundit::Authorization

  # A block id marker as the converter reads it: " ^id" at the end of a line, or a line of its own.
  BLOCK_MARKER = /(?:\A|[ \n])\^[A-Za-z0-9-]{2,}[ \t]*$/

  # The content changed after the caller read it, so what it sends would replace edits it never saw.
  class StaleContent < StandardError
    attr_reader :sync_version

    def initialize(sync_version)
      @sync_version = sync_version
      super("The document changed since you read it: it is now at sync_version #{sync_version}. " \
            "Read it again, apply your change to the current content and send that sync_version.")
    end
  end

  attr_reader :pundit_user

  def initialize(pundit_user:)
    @pundit_user = pundit_user
  end

  # Titles are stored as given and the icon is a field of its own; see
  # HasIcon#assign_title_and_icon. An explicit title wins over the frontmatter `title`, which
  # in turn wins over the default, so an exported file keeps its name when it is written back.
  # A blank title counts as none given, as it does for update!.
  def create!(space_id:, parent_document_id: nil, title:, markdown:, icon: nil, color: nil)
    ActiveRecord::Base.transaction do
      space = pundit_user.current_organization.spaces.find(space_id)
      authorize space, :update?

      parent_document = space.documents.find(parent_document_id) if parent_document_id.present?
      authorize parent_document, :show? if parent_document

      # Frontmatter alone leaves an empty body, which must still count as content given so
      # that its tags are applied.
      content_given = markdown.present?
      markdown, frontmatter_data = extract_frontmatter(markdown) if content_given

      document = space.documents.new(space: space, organization: space.organization)
      document.assign_title_and_icon(title: title.presence || frontmatter_to_title(frontmatter_data) || "Untitled", icon: icon.nil? ? frontmatter_to_icon(frontmatter_data) : icon)
      document.assign_color(color.nil? ? frontmatter_to_color(frontmatter_data) : color)

      authorize document, :create?

      document.save!

      # Create initial version with content if provided
      if content_given
        blocks = BlocknoteConverterService.markdown_to_blocks(markdown)
        sync = BlocknoteConverterService.blocks_to_yjs(blocks)

        document.versions.create!(
          content_blocks: blocks,
          # content_html: html,
          created_by: pundit_user.user
        )

        document.create_content!(sync: sync)

        # Process tags from frontmatter
        if frontmatter_data && frontmatter_data["tags"].is_a?(Array)
          TagsService.new(object: document, organization: document.organization).update_tags(frontmatter_data["tags"])
        end
      end

      # Added last: the Space row lock is held until this transaction commits, so it must
      # not be taken before the BlocknoteConverterService subprocess calls above.
      space.insert_hierarchy_node!(document.id, parent_id: parent_document&.id)

      document
    end
  end

  # Renames, changes the icon or color, replaces the content, or any mix of them. A rename or icon
  # change alone creates no version: versions snapshot content, and neither is part of it.
  #
  # sync_version is the one the caller read. When it is given and the content has moved on, the
  # update is refused with StaleContent rather than replacing edits the caller never saw. The
  # check holds the content row, so a write can't land between it and the update. It guards
  # content only: a rename or an icon needs no version.
  def update!(document_id:, markdown: nil, title: nil, icon: nil, color: nil, sync_version: nil)
    raise ArgumentError, "Provide a title, icon, color, or markdown" if [markdown, title, icon, color].all?(&:nil?)
    raise ArgumentError, "Title can't be blank" if !title.nil? && title.blank?

    ActiveRecord::Base.transaction do
      document = pundit_user.current_organization.documents.find(document_id)
      authorize document, :update?

      check_sync_version!(document, sync_version) unless markdown.nil? || sync_version.nil?

      markdown, frontmatter_data = extract_frontmatter(markdown) unless markdown.nil?

      # An explicit argument wins; a valid frontmatter key applies otherwise. A missing or
      # invalid key is dropped, so frontmatter can set a color or icon but never clear one.
      document.assign_title_and_icon(title: title || frontmatter_to_title(frontmatter_data), icon: icon.nil? ? frontmatter_to_icon(frontmatter_data) : icon)
      document.assign_color(color.nil? ? frontmatter_to_color(frontmatter_data) : color)
      document.save!

      next document if markdown.nil?

      # Convert markdown to blocks and sync
      blocks = BlocknoteConverterService.markdown_to_blocks(markdown, existing_ids: existing_block_ids(document, markdown))

      # A document that already has content is brought to the new blocks by an update, which
      # merges with an open editor; replacing its state would leave that editor holding one that
      # no longer matches the stored one, and its next keystroke would undo this change.
      stored_sync = document.content&.sync
      if stored_sync.present?
        update, sync = BlocknoteConverterService.blocks_to_yjs_update(stored_sync, blocks)
      else
        sync = BlocknoteConverterService.blocks_to_yjs(blocks)
      end

      # Create new version with updated content
      document.versions.create!(
        content_blocks: blocks,
        created_by: pundit_user.user
      )

      # Update document sync
      document.content_or_build.update!(sync: sync)

      # After the commit, so a connection that takes it up and saves its state never waits on
      # this transaction's row.
      if update
        ActiveRecord.after_all_transactions_commit { DocumentChannel.broadcast_update(document.id, update) }
      end

      # Process tags from frontmatter
      if frontmatter_data && frontmatter_data["tags"].is_a?(Array)
        TagsService.new(object: document, organization: document.organization).update_tags(frontmatter_data["tags"])
      end

      document
    end
  end

  def create_from_file!(space_id:, file:, parent_document_id: nil, title: nil, icon: nil, color: nil)
    ActiveRecord::Base.transaction do
      space = pundit_user.current_organization.spaces.find(space_id)
      authorize space, :update?

      parent_document = space.documents.find(parent_document_id) if parent_document_id.present?
      authorize parent_document, :show? if parent_document

      # Check an explicit color and icon before the conversion: a bad one is a rejected request,
      # and the conversion is the expensive part. Both are assigned again below, where the
      # frontmatter may supply a value the caller left out.
      document = space.documents.new(space: space, organization: space.organization)
      document.assign_title_and_icon(icon: icon)
      document.assign_color(color)

      # Convert file to markdown
      conversion_result = PandocConverterService.convert_upload(file)

      # Extract frontmatter from converted markdown
      markdown, frontmatter_data = extract_frontmatter(conversion_result[:markdown])

      # Provided title, then the frontmatter title, then the one the converter took from the
      # file name, which is always there, so it must come after the frontmatter.
      document_title = title.presence || frontmatter_to_title(frontmatter_data) || conversion_result[:title] || "Untitled"

      # Create document
      document.assign_title_and_icon(title: document_title, icon: icon.nil? ? frontmatter_to_icon(frontmatter_data) : icon)
      document.assign_color(color.nil? ? frontmatter_to_color(frontmatter_data) : color)

      authorize document, :create?
      document.save!

      # Create initial version with content
      blocks = BlocknoteConverterService.markdown_to_blocks(markdown)
      sync = BlocknoteConverterService.blocks_to_yjs(blocks)

      document.versions.create!(
        content_blocks: blocks,
        created_by: pundit_user.user
      )

      document.create_content!(sync: sync)

      # Process tags from frontmatter
      if frontmatter_data && frontmatter_data["tags"].is_a?(Array)
        TagsService.new(object: document, organization: document.organization).update_tags(frontmatter_data["tags"])
      end

      # Added last: the Space row lock is held until this transaction commits, so it must
      # not be taken before the conversion subprocess calls above.
      space.insert_hierarchy_node!(document.id, parent_id: parent_document&.id)

      document
    end
  end

  private

  def check_sync_version!(document, expected)
    content = document.content
    content&.lock!
    current = content&.sync_version.to_i

    expected = Integer(expected.to_s, 10, exception: false)
    raise ArgumentError, "sync_version must be a whole number, as returned by Read Document" if expected.nil?

    raise StaleContent, current unless current == expected
  end

  # Markdown read with block_ids, or of a block that has comments, carries " ^id" markers, which keep a block's id across an
  # update: whatever points at the block (a comment, a link) still finds it. Only markers naming
  # a block of this document count; any other "^word" is the author's own text. Markdown with no
  # marker skips the lookup, which is a conversion of the live content.
  #
  # The blocks of the live content count as well as those of the saved version: a client reads
  # what the editor shows, and a block someone has added since the last save is in the document
  # for it.
  def existing_block_ids(document, markdown)
    return nil unless markdown.match?(BLOCK_MARKER)

    live = BlocknoteBlocks.block_ids(document.to_blocks)
    return live if document.draft?

    BlocknoteBlocks.block_ids(document.current_blocks) | live
  end
end
