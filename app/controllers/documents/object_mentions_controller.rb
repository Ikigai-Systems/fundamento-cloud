class Documents::ObjectMentionsController < ApplicationController
  include EnsureOrganization
  include LoadDocument.from_param(:document_id)

  after_action :verify_authorized

  before_action :load_document

  def index
    authorize @document, :show?

    mentions = ObjectMention.for_source(@document).current

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
