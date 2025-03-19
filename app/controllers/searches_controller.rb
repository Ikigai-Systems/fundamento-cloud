class SearchesController < ApplicationController\
  # maybe this should go to controllers/api/v1, I dunno

  include Pundit::Authorization

  after_action :verify_policy_scoped

  def show
    # todo: later query for other entities as well (spaces, organizations, etc) and respect 'query' param to narrow down searches

    respond_to do |format|
      format.json { render json: policy_scope(current_organization.documents, policy_scope_class: DocumentPolicy::Scope), :except => [:sync] }
      format.all { head :unprocessable_content }
    end
  end
end
