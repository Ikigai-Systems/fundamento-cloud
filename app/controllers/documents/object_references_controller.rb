class Documents::ObjectReferencesController < ApplicationController
  include EnsureOrganization
  include LoadDocument.from_param(:document_id)

  after_action :verify_authorized

  before_action :load_document

  def index
    authorize @document, :show?

    references = ObjectReference.for_source(@document).current

    render json: {
      object_references: references.map { |ref|
        {
          node_id: ref.source_node_id,
          target_type: ref.target_type,
          target_id: ref.target_id,
          title: ref.title
        }
      }
    }
  end
end
