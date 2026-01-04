module Api
  module V1
    class DocumentsController < Api::ApiController
      def index
        space = current_organization.spaces.find_by_param!(params[:space_npi])
        authorize space

        documents = policy_scope(space.documents).order(:title)

        render json: documents.map { |doc|
          {
            id: doc.id,
            title: doc.title,
            created_at: doc.created_at,
            updated_at: doc.updated_at
          }
        }
      end

      def create
        if document_params[:file].nil? && document_params[:markdown].nil?
          render json: { errors: { base: "Either file or markdown must be present" } }, status: :unprocessable_entity
          return
        end

        document = if document_params[:file].present?
          DocumentService.new(pundit_user: pundit_user).
            create_from_file!(
              space_id: params[:space_npi],
              title: document_params[:title],
              parent_document_id: document_params[:parent_document_npi],
              file: document_params[:file],
            )
        else
          DocumentService.new(pundit_user: pundit_user).
            create!(
              space_id: params[:space_npi],
              title: document_params[:title],
              parent_document_id: document_params[:parent_document_npi],
              markdown: document_params[:markdown],
            )
        end

        render json: {
          id: document.id,
          title: document.title,
          created_at: document.created_at,
          updated_at: document.updated_at
        }, status: :created
      rescue BlocknoteConverterService::ConversionError
        render json: { errors: { markdown: "Conversion failed" } }, status: :unprocessable_entity
      rescue PandocConverterService::ConversionError => e
        render json: { errors: { file: e.message } }, status: :unprocessable_entity
      rescue ActiveRecord::RecordInvalid => invalid
        render json: { errors: invalid.record.errors.full_messages }, status: :unprocessable_entity
      end

      def show
        document = current_organization.documents.find(params[:npi])
        authorize document

        blocks = if document.versions.empty?
          document.to_blocks
        else
          document.versions.last.content_blocks
        end

        respond_to do |format|
          format.json do
            render json: {
              id: document.id,
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
              document_id: params[:npi],
              markdown: document_params[:markdown]
            )

          render json: {
            id: document.id,
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
        params.require(:document).permit(:title, :markdown, :parent_document_npi, :file)
      end
    end
  end
end
