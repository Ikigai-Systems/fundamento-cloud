class FavoritesController < ApplicationController
  after_action :verify_authorized

  def new
    @public_link = current_organization.public_links.new(public_link_params)

    authorize @public_link.object.space, :show?

    respond_to do |format|
      format.html { redirect_to public_links_path }
      format.json { render json: @public_link }
      format.turbo_stream
    end
  end

  def create
    @favorite = pundit_user.organization_user.favorites.new(public_link_params)

    authorize @favorite, :update?

    if @favorite.save
      respond_to do |format|
        format.html { redirect_to @favorite }
        format.json { render json: @favorite, status: :created }
        format.turbo_stream
      end
    else
      render json: @favorite.errors, status: :unprocessable_content
    end
  end

  def destroy
    @favorite = pundit_user.organization_user.favorites.find_by_npi!(params[:npi])

    authorize @favorite, :update?

    @favorite.destroy!

    respond_to do |format|
      format.html { redirect_to public_links_path }
      format.json { render json: @favorite }
      format.turbo_stream
    end
  end

  def show
    @public_link = current_organization.public_links.find(params[:id])
    # @public_link.increment!(:clicks)

    authorize @public_link.object.space, :show?

    respond_to do |format|
      format.html { redirect_to public_links_path }
      format.json { render json: @public_link }
      format.turbo_stream
    end
  end

  def index
    @public_links = current_organization.public_links

    authorize current_organization, :show?

    respond_to do |format|
      format.html
      format.json { render json: @public_links }
    end
  end

  protected

  def public_link_params
    params.require(:favorite).permit(:object_id, :object_type)
  end
end