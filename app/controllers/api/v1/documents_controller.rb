module Api
  module V1
    class DocumentsController < Api::ApiController
      def index
        space = current_organization.spaces.find_by_param!(params[:space_npi])
        authorize space

        documents = policy_scope(space.documents).order(:title)

        render json: documents.map { |doc|
          {
            npi: doc.npi,
            title: doc.title,
            created_at: doc.created_at,
            updated_at: doc.updated_at
          }
        }
      end

      def create
        space = current_organization.spaces.find_by_param!(params[:space_npi])
        authorize space, :show?

        document = current_organization.documents.new(
          title: document_params[:title] || "Untitled",
          space: space
        )

        authorize document, :create?

        if document.save
          # Add to hierarchy
          hierarchy_node = space.create_hierarchy_node(document.id)
          parent_document_npi = document_params[:parent_document_npi]

          if parent_document_npi.present?
            parent_document = space.documents.find_by_param!(parent_document_npi)

            if space.add_item_to_hierarchy!(space.hierarchy, parent_document.id, hierarchy_node).blank?
              space.hierarchy.append(hierarchy_node)
            end
          else
            space.hierarchy.append(hierarchy_node)
          end

          space.save!

          # Create initial version with content if provided
          if document_params[:markdown].present?
            begin
              blocks = BlocknoteConverterService.markdown_to_blocks(document_params[:markdown])
              sync = BlocknoteConverterService.blocks_to_yjs(blocks)

              document.versions.create!(
                content_blocks: blocks,
                # content_html: html,
                created_by: current_user
              )

              document.update!(sync: sync)
            rescue StandardError => e
              return render json: { errors: { markdown: "Conversion failed" } }, status: :unprocessable_entity
            end
          end

          render json: {
            npi: document.npi,
            title: document.title,
            created_at: document.created_at,
            updated_at: document.updated_at
          }, status: :created
        else
          render json: { errors: document.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def show
        document = current_organization.documents.find_by_param!(params[:npi])
        authorize document

        blocks = if document.versions.empty?
          document.to_blocks
        else
          document.versions.last.content_blocks
        end

        respond_to do |format|
          format.json do
            render json: {
              npi: document.npi,
              title: document.title,
              created_at: document.created_at,
              updated_at: document.updated_at,
              content: blocks,
              tags: document.tags.map { |tag| "##{tag.name}" }
            }
          end

          format.md do
            render locals: { content: BlocknoteConverterService.blocks_to_markdown(blocks) }
          end
        end
      end

      private

      def document_params
        params.require(:document).permit(:title, :markdown, :parent_document_npi)
      end
    end
  end
end
