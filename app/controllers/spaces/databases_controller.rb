class Spaces::DatabasesController < ApplicationController
  include EnsureOrganization

  layout -> { turbo_frame_request? ? "turbo_rails/frame" : "full_width_application" }

  def show
    @space = current_organization.spaces.find(params[:space_id])
    @documents = @space.documents_from_hierarchy
  end
end
