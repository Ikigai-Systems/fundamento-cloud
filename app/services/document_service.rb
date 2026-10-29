class DocumentService
  include MarkdownFrontmatter
  include Pundit::Authorization

  attr_reader :pundit_user

  def initialize(pundit_user:)
    @pundit_user = pundit_user
  end

  # Titles are stored as given and the icon is a field of its own; see
  # HasIcon#assign_title_and_icon.
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
      document.assign_title_and_icon(title: title || "Untitled", icon: icon.nil? ? frontmatter_to_icon(frontmatter_data) : icon)
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
  def update!(document_id:, markdown: nil, title: nil, icon: nil, color: nil)
    raise ArgumentError, "Provide a title, icon, color, or markdown" if [markdown, title, icon, color].all?(&:nil?)
    raise ArgumentError, "Title can't be blank" if !title.nil? && title.blank?

    ActiveRecord::Base.transaction do
      document = pundit_user.current_organization.documents.find(document_id)
      authorize document, :update?

      markdown, frontmatter_data = extract_frontmatter(markdown) unless markdown.nil?

      # An explicit argument wins; a valid frontmatter key applies otherwise. A missing or
      # invalid key is dropped, so frontmatter can set a color or icon but never clear one.
      document.assign_title_and_icon(title: title, icon: icon.nil? ? frontmatter_to_icon(frontmatter_data) : icon)
      document.assign_color(color.nil? ? frontmatter_to_color(frontmatter_data) : color)
      document.save!

      next document if markdown.nil?

      # Convert markdown to blocks and sync
      blocks = BlocknoteConverterService.markdown_to_blocks(markdown)
      sync = BlocknoteConverterService.blocks_to_yjs(blocks)

      # Create new version with updated content
      document.versions.create!(
        content_blocks: blocks,
        created_by: pundit_user.user
      )

      # Update document sync
      document.content_or_build.update!(sync: sync)

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

      # Convert file to markdown
      conversion_result = PandocConverterService.convert_upload(file)

      # Use provided title or extracted title or "Untitled"
      document_title = title.presence || conversion_result[:title] || "Untitled"

      # Extract frontmatter from converted markdown
      markdown, frontmatter_data = extract_frontmatter(conversion_result[:markdown])

      # Create document
      document = space.documents.new(space: space, organization: space.organization)
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

end