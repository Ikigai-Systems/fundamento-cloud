class AttachmentsController < ApplicationController
  include EnsureOrganization

  after_action :verify_authorized

  def show
    @attachment = current_organization.attachments.find(params[:id])

    authorize @attachment, :show?

    # Dual-read: Read from Active Storage if available, fallback to database
    if @attachment.file.attached?
      redirect_to rails_blob_path(@attachment.file, disposition: "inline"), allow_other_host: true
    else
      send_data @attachment.data, type: @attachment.mime_type, disposition: "inline"
    end
  end

  def create
    # build a photo and pass it into a block to set other attributes
    @attachment = current_organization.attachments.new(attachment_params) do |t|
      if params[:file]
        uploaded_file = params[:file]
        file_data = uploaded_file.read

        # DUAL WRITE: Store in both locations during migration
        t.data = file_data  # Database storage (existing)
        t.filename = uploaded_file.original_filename
        t.mime_type = uploaded_file.content_type

        # Active Storage (new)
        t.file.attach(
          io: StringIO.new(file_data),
          filename: uploaded_file.original_filename,
          content_type: uploaded_file.content_type
        )
      end
    end

    authorize @attachment, :create?

    if @attachment.save
      render json: @attachment.as_json(except: [:data]).merge({location: attachment_url(@attachment)}), status: :created
    else
      render json: @attachment.errors, status: :unprocessable_content
    end
  end

  def destroy
    @attachment = current_organization.attachments.find(params[:id])

    authorize @attachment, :update?

    @attachment.destroy
  end

  protected

  def attachment_params
    params.require(:attachment).permit(
      :parent_id,
      :parent_type,
    )
  end
end
