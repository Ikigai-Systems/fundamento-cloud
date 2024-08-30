class PublicLinksController < ApplicationController
  skip_before_action :authenticate_user!, only: [:show]
  skip_before_action :ensure_organization_exists, only: [:show]
  skip_before_action :select_current_organization, only: [:show]
  skip_before_action :load_current_organization_from_cookie, only: [:show]
  skip_before_action :ensure_space_exists, only: [:show]

  def create
    @public_link = current_organization.public_links.new(public_link_params)
    @public_link.updated_by = current_user

    if @public_link.save
      render json: @public_link, status: :created
    else
      render json: @public_link.errors, status: :unprocessable_content
    end
  end

  def update
    @public_link = current_organization.public_links.find(params[:id])
    # @public_link.assign_attributes(public_link_params)
    @public_link.generate_npi
    @public_link.updated_by = current_user

    if @public_link.save
      render json: @public_link, status: :ok
    else
      render json: @public_link.errors, status: :unprocessable_content
    end
  end

  def destroy
    @public_link = current_organization.public_links.find(params[:id])
    @public_link.destroy!

    index
  end

  def show
    @public_link = current_organization.public_links.find_by_npi!(params[:npi])
    # @public_link.increment!(:clicks)

    if @public_link.object_type == "Document"
      redirect_to @public_link.object
    else
      redirect_to @public_link.object, status: :see_other
    end
  end

  def index
    render json: current_organization.public_links
  end

  protected

  def public_link_params
    params.require(:public_link).permit(:object_id, :object_type)
  end
end