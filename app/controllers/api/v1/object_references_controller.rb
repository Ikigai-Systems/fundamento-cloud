module Api
  module V1
    class ObjectReferencesController < Api::ApiController
      def index
        document = current_organization.documents.find(params[:document_id])

        authorize document, :show?

        references = ObjectReference.for_source(document).current

        render json: {
          object_references: references.map { |ref|
            {
              id: ref.id,
              target_type: ref.target_type,
              target_id: ref.target_id,
              title: ref.title
            }
          }
        }
      end
    end
  end
end
