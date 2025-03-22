class SearchesController < ApplicationController
  # maybe this should go to controllers/api/v1, I dunno

  include Pundit::Authorization

  after_action :verify_policy_scoped

  def show
    # todo: later query for other entities as well (spaces, organizations, etc) and respect 'query' param to narrow down searches

    documents = policy_scope(current_organization.documents, policy_scope_class: DocumentPolicy::Scope)

    @results = documents.map do |document|
      parent_path = ""
      parent = document.parent
      while parent.present?
        parent_path = "#{parent.title} › #{parent_path}"
        parent = parent.parent
      end
      {
        document: {
          npi: document.npi,
          title: document.title,
          parent_path: parent_path
        },
        space: {
          name: document.space.name,
        }
      }
    end

    respond_to do |format|
      format.json { render json: @results }
      format.all { head :unprocessable_content }
    end
  end
end
