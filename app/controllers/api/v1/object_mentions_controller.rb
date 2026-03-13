module Api
  module V1
    class ObjectMentionsController < Api::ApiController
      def index
        document = current_organization.documents.find(params[:document_id])

        authorize document, :show?

        mentions = ObjectMention.for_source(document).current

        render json: {
          object_mentions: mentions.map { |om|
            {
              id: om.id,
              target_type: om.target_type,
              target_id: om.target_id,
              title: om.title
            }
          }
        }
      end
    end
  end
end
