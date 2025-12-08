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

      def show
        document = current_organization.documents.find_by_param!(params[:npi])
        authorize document

        content = if document.versions.empty?
          BlocknoteConverterService.to_markdown(document.to_blocks)
        else
          BlocknoteConverterService.to_markdown(document.versions.last.content_blocks)
        end

        render json: {
          npi: document.npi,
          title: document.title,
          created_at: document.created_at,
          updated_at: document.updated_at,
          content: content,
          tags: document.tags.map { |tag| "##{tag.name}" }
        }
      end
    end
  end
end
