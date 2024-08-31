class PublicLinksController < ApplicationController

  def new
    @public_link = current_organization.public_links.new(public_link_params)

    respond_to do |format|
      format.html { redirect_to public_links_path }
      format.json { render json: @public_link }
      format.turbo_stream
    end
  end

  def create
    @public_link = current_organization.public_links.new(public_link_params)
    @public_link.updated_by = current_user

    if @public_link.save
      respond_to do |format|
        format.html { redirect_to @public_link }
        format.json { render json: @public_link, status: :created }
        format.turbo_stream
      end
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
      respond_to do |format|
        format.html { redirect_to @public_link }
        format.json { render json: @public_link }
        format.turbo_stream
      end
    else
      render json: @public_link.errors, status: :unprocessable_content
    end
  end

  def destroy
    @public_link = current_organization.public_links.find(params[:id])
    @public_link.destroy!

    respond_to do |format|
      format.html { redirect_to public_links_path }
      format.json { render json: @public_link }
      format.turbo_stream
    end
  end

  def show
    @public_link = current_organization.public_links.find(params[:id])
    # @public_link.increment!(:clicks)

    respond_to do |format|
      format.html { redirect_to public_links_path }
      format.json { render json: @public_link }
      format.turbo_stream
    end
  end

  def index
    @public_links = current_organization.public_links

    respond_to do |format|
      format.html
      format.json { render json: @public_links }
    end
  end

  protected

  def public_link_params
    params.require(:public_link).permit(:object_id, :object_type)
  end
end