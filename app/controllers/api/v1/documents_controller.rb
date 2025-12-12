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
        begin
          document = DocumentService.new(pundit_user: pundit_user).
            create!(
              space_npi: params[:space_npi],
              title: document_params[:title],
              parent_document_npi: document_params[:parent_document_npi],
              markdown: document_params[:markdown]
            )

          render json: {
            npi: document.npi,
            title: document.title,
            created_at: document.created_at,
            updated_at: document.updated_at
          }, status: :created
        rescue BlocknoteConverterService::ConversionError
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

      def update
        begin
          document = DocumentService.new(pundit_user: pundit_user).
            update!(
              document_npi: params[:npi],
              markdown: document_params[:markdown]
            )

          render json: {
            npi: document.npi,
            title: document.title,
            created_at: document.created_at,
            updated_at: document.updated_at
          }
        rescue BlocknoteConverterService::ConversionError
          render json: { errors: { markdown: "Conversion failed" } }, status: :unprocessable_entity
        rescue ActiveRecord::RecordInvalid => invalid
          render json: { errors: invalid.record.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def document_params
        params.require(:document).permit(:title, :markdown, :parent_document_npi)
      end
    end
  end
end
