class CreateDocumentService

  include Pundit::Authorization

  attr_reader :pundit_user

  def initialize(pundit_user:)
    @pundit_user = pundit_user
  end

  def create!(space_npi:, parent_document_npi: nil, title:, markdown:)
    ActiveRecord::Base.transaction do
      space = pundit_user.current_organization.spaces.find_by_param!(space_npi)
      authorize space, :update?

      parent_document = space.documents.find_by_param!(parent_document_npi) if parent_document_npi.present?
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

  def extract_frontmatter(markdown)
    frontmatter_data = nil

    # Extract and parse frontmatter if present
    if markdown.start_with?("---\n")
      parts = markdown.split(/^---\s*$/m, 3)
      if parts.length >= 3
        frontmatter_data = YAML.safe_load(parts[1])
        markdown = parts[2].strip
      end
    end

    [markdown, frontmatter_data]
  end
end