class ImportSessionsController < ApplicationController
  include EnsureOrganization

  after_action :verify_authorized

  def index
    @sessions = policy_scope(current_organization.import_sessions).recent
                  .includes(:space, :organization_membership)

    authorize ImportSession, :index?
  end

  def show
    @session = current_organization.import_sessions.find(params[:id])
    authorize @session, :show?
    @import_files = @session.import_files.order(:relative_path)
  end

  def new
    @session = current_organization.import_sessions.new
    @spaces = updatable_spaces
    authorize @session, :create?
  end

  private

  def updatable_spaces
    policy_scope(current_organization.spaces).select do |space|
      policy(space).update?
    end
  end
end
