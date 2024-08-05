class SpacesController < ApplicationController
  layout 'full_width_application'
  def show
    @space = current_organization.spaces.find(params[:id])

    @documents = current_organization.documents.find(@space.hierarchy || [])
  end
end
