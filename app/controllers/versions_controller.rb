class VersionsController < ApplicationController
  layout "full_width_application"

  def create
    blocks = JSON.parse(params["blocks"].to_s)

    @document = current_organization.documents.find(params[:document_id])

    blocks2 = @document.to_blocks

    diff = HashDiff.diff(blocks, blocks2)
    if diff.present?
      Sentry.capture_message("XmlfragmentToBlock mismatch for #{params[:space_id]} / #{params[:document_id]} (call stefan) : #{diff}")
    end

    # pp JSON.pretty_generate(blocks2)

    redirect_to edit_space_document_path(params[:space_npi], params[:document_id])

    # respond_to do |format|
    #   format.json { render json: current_organization.documents, :except => [:sync] }
    #   format.all { head :unprocessable_content }
    # end
  end

  def index
    @document = current_organization.documents.find(params[:document_id])

    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @documents = @space.documents_from_hierarchy
  end

end
