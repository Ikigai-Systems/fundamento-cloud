class SpacesController < ApplicationController
  layout 'full_width_application'
  def show
    @space = Space.find(params[:id])

    @documents = Document.find(@space.hierarchy || [])
  end
end
