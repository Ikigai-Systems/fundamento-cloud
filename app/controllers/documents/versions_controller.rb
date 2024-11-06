class Documents::VersionsController < ApplicationController
  layout -> { turbo_frame_request? ? "turbo_rails/frame" : "full_width_application" }

  after_action :verify_authorized

  def create
    blocks = JSON.parse(params["blocks"].to_s)

    @document = current_organization.documents.find(params[:document_id])

    authorize @document, :update?

    blocks2 = @document.to_blocks
    # pp JSON.pretty_generate(blocks2)

    diff = HashDiff.diff(blocks, blocks2)
    if diff.present?
      Sentry.capture_message("XmlfragmentToBlock mismatch for #{params[:space_id]} / #{params[:document_id]} (call stefan) : #{diff}")
      flash[:warning] = "Detected document desynchronization between your local version and server. This might mean network connection problems, server performance problems or someone else editing the document concurrently. Proceeding with saving your local version."
    end

    @version = @document.versions.new
    @version.content = blocks
    @version.created_by = current_user

    if @version.save
      respond_to do |format|
        flash[:notice] = "Document version has been saved."
        format.html { redirect_to space_document_path(params[:space_npi], @document) }
      end
    else
      render :new, status: :unprocessable_content
    end
  rescue Exception => e
    respond_to do |format|
      format.html { raise e }
      format.turbo_stream do
        flash[:error] = e.to_s
        render turbo_stream: [turbo_stream.append("flashes", partial: "flash_messages_as_alerts", locals: { flash: flash})]
        flash.clear
      end
    end
  end

  def index
    @document = current_organization.documents.find(params[:document_id])

    authorize @document, :show?

    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @documents = @space.documents_from_hierarchy

    @versions = @document.versions.order('created_at DESC')
  end

  def show
    @document = current_organization.documents.find(params[:document_id])

    authorize @document, :show?

    if params[:id] == "latest"
      @version = @document.versions.latest
    else
      @version = @document.versions.find_by(sequential_id: params[:id])
    end
    raise ActionController::RoutingError, 'Not Found' if @version.blank?

    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @documents = @space.documents_from_hierarchy

    @versions = @document.versions.order('created_at DESC')
  end
end
