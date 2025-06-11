class FavoritesController < ApplicationController
  include EnsureOrganization

  after_action :verify_authorized, except: [:index]

  def create
    @favorite = pundit_user.organization_user.favorites.new(favorite_params)

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

  def index
    respond_to do |format|
      format.html { render partial: "favorites_tab" }
      format.json { render json: pundit_user.organization_user.favorites }
    end
  end

  protected

  def favorite_params
    params.require(:favorite).permit(:object_id, :object_type)
  end
end