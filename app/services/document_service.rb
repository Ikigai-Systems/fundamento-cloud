class DocumentService
  include MarkdownFrontmatter
  include Pundit::Authorization

  attr_reader :pundit_user

  def initialize(pundit_user:)
    @pundit_user = pundit_user
  end

  def create!(space_id:, parent_document_id: nil, title:, markdown:)
    ActiveRecord::Base.transaction do
      space = pundit_user.current_organization.spaces.find(space_id)
      authorize space, :update?

      parent_document = space.documents.find(parent_document_id) if parent_document_id.present?
      authorize parent_document, :show? if parent_document

      document = space.documents.new(
        title: title || "Untitled",
        space: space,
        organization: space.organization,
      )

      authorize document, :create?

      document.save!

      # Add to hierarchy
      hierarchy_node = space.create_hierarchy_node(document.id)

      if parent_document.present?
        if space.add_item_to_hierarchy!(space.hierarchy, parent_document.id, hierarchy_node).blank?
          space.hierarchy.append(hierarchy_node)
        end
      else
        space.hierarchy.append(hierarchy_node)
      end

      space.save!

      # Create initial version with content if provided
      if markdown.present?
        markdown, frontmatter_data = extract_frontmatter(markdown)

        blocks = BlocknoteConverterService.markdown_to_blocks(markdown)
        sync = BlocknoteConverterService.blocks_to_yjs(blocks)

        document.versions.create!(
          content_blocks: blocks,
          # content_html: html,
          created_by: pundit_user.user
        )

        document.update!(sync: sync)

        # Process tags from frontmatter
        if frontmatter_data && frontmatter_data["tags"].is_a?(Array)
          TagsService.new(object: document, organization: document.organization).update_tags(frontmatter_data["tags"])
        end
      end

      document
    end
  end

  def update!(document_id:, markdown:)
    ActiveRecord::Base.transaction do
      document = pundit_user.current_organization.documents.find(document_id)
      authorize document, :update?

      # Extract and process frontmatter
      markdown, frontmatter_data = extract_frontmatter(markdown)

      # Convert markdown to blocks and sync
      blocks = BlocknoteConverterService.markdown_to_blocks(markdown)
      sync = BlocknoteConverterService.blocks_to_yjs(blocks)

      # Create new version with updated content
      document.versions.create!(
        content_blocks: blocks,
        created_by: pundit_user.user
      )

      # Update document sync
      document.update!(sync: sync)

      # Process tags from frontmatter
      if frontmatter_data && frontmatter_data["tags"].is_a?(Array)
        TagsService.new(object: document, organization: document.organization).update_tags(frontmatter_data["tags"])
      end

      document
    end
  end

  def create_from_file!(space_id:, file:, parent_document_id: nil, title: nil)
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
      document = space.documents.new(
        title: document_title,
        space: space,
        organization: space.organization,
      )

      authorize document, :create?
      document.save!

      # Add to hierarchy
      hierarchy_node = space.create_hierarchy_node(document.id)

      if parent_document.present?
        if space.add_item_to_hierarchy!(space.hierarchy, parent_document.id, hierarchy_node).blank?
          space.hierarchy.append(hierarchy_node)
        end
      else
        space.hierarchy.append(hierarchy_node)
      end

      space.save!

      # Create initial version with content
      blocks = BlocknoteConverterService.markdown_to_blocks(markdown)
      sync = BlocknoteConverterService.blocks_to_yjs(blocks)

      document.versions.create!(
        content_blocks: blocks,
        created_by: pundit_user.user
      )

      document.update!(sync: sync)

      # Process tags from frontmatter
      if frontmatter_data && frontmatter_data["tags"].is_a?(Array)
        TagsService.new(object: document, organization: document.organization).update_tags(frontmatter_data["tags"])
      end

      document
    end
  end

end