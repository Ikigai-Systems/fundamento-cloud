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
        authorize space, :update?

        parent_document_npi = document_params[:parent_document_npi]
        parent_document = space.documents.find_by_param!(parent_document_npi) if parent_document_npi.present?

        authorize parent_document, :show? if parent_document

        begin
          document = CreateDocumentService.new(pundit_user: pundit_user).create!(space, title: document_params[:title], parent_document:, markdown: document_params[:markdown])

          render json: {
            npi: document.npi,
            title: document.title,
            created_at: document.created_at,
            updated_at: document.updated_at
          }, status: :created
        rescue StandardError
          render json: { errors: { markdown: "Conversion failed" } }, status: :unprocessable_entity
        rescue ActiveRecord::RecordInvalid => invalid
          render json: { errors: invalid.record.errors.full_messages }, status: :unprocessable_entity
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
