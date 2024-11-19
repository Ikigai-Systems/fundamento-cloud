class AutomationsController < ApplicationController
  def index
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @automations = policy_scope(@space.automations).order(:title)
  end
end