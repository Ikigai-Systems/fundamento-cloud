class SpacesController < ApplicationController
  layout 'full_width_application'
  def show
    @space = current_organization.spaces.find(params[:id])

    if @space.home_document.present?
      redirect_to edit_space_document_url(@space, @space.home_document)
    end

    @documents = current_organization.documents.find(@space.hierarchy || [])
  end

  def new
    @space = Space.new
  end

  def create
    @space = current_organization.spaces.new(space_params)
    # @organization_user = SpaceUser.create(
    #   space: @space,
    #   user: current_user
    # )

    if @space.save # && @organization_user.save
      redirect_to @space, notice: 'Space was successfully created.'
    else
      render :new
    end
  end

  def edit
    @space = current_organization.spaces.find_by_id!(params[:id])
  end

  def update
    @space = current_organization.spaces.find_by_id!(params[:id])

    if @space.update(space_params)
      redirect_to @space, notice: 'Space was successfully updated.'
    else
      render :edit
    end
  end

  private

  def space_params
    params.require(:space).permit(:name)
  end

end
