class Documents::VersionsController < ApplicationController
  layout "full_width_application"

  def create
    blocks = JSON.parse(params["blocks"].to_s)

    @document = current_organization.documents.find(params[:document_id])

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
        format.html { redirect_to edit_space_document_path(params[:space_npi], @document) }
        format.turbo_stream do
          render turbo_stream: [turbo_stream.append("flashes", partial: "flash_messages_as_alerts", locals: { flash: flash})]
          flash.clear
        end
      end
    else
      render :new, status: 422
    end
  end

  def index
    @document = current_organization.documents.find(params[:document_id])

    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @documents = @space.documents_from_hierarchy

    @versions = @document.versions.order('created_at DESC')
  end

  def show
    @document = current_organization.documents.find(params[:document_id])

    @version = @document.versions.find_by(sequential_id: params[:id])
    raise ActionController::RoutingError, 'Not Found' if @version.blank?

    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @documents = @space.documents_from_hierarchy

    # todo: zapytać kiedyś Pawła jakie jest zaklęcie, żeby nie przekazywać do frontendu kilku atrybutów np. "id" "secret"
    @versions = @document.versions.order('created_at DESC')
  end
end
