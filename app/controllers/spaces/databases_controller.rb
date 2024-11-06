class Spaces::DatabasesController < ApplicationController
  layout -> { turbo_frame_request? ? "turbo_rails/frame" : "full_width_application" }

  def show
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @documents = @space.documents_from_hierarchy
  end
end
