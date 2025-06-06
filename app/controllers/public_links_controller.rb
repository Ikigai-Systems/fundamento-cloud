class PublicLinksController < ApplicationController
  after_action :verify_authorized

  def new
    @public_link = current_organization.public_links.new(create_params)

    authorize @public_link.object.space, :show?

    respond_to do |format|
      format.html { redirect_to public_links_path }
      format.json { render json: @public_link }
      format.turbo_stream
    end
  end

  def create
    @public_link = current_organization.public_links.new(create_params)
    @public_link.updated_by = current_user

    authorize @public_link.object.space, :update?

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
    if update_params[:allowed_emails].present?
      @public_link.allowed_emails = @public_link.allowed_emails + Array(update_params[:allowed_emails])
    end
    @public_link.generate_npi if params[:refresh].to_b
    @public_link.updated_by = current_user

    authorize @public_link.object.space, :update?

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

    authorize @public_link.object.space, :update?

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

  def create_params
    params.require(:public_link).permit(:object_id, :object_type)
  end

  def update_params
    params.permit(:public_link).permit(:allowed_emails)
  end
end