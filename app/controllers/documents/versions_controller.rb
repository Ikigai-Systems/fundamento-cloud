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
    end


    @version = @document.versions.new
    @version.content = blocks2

    if @version.save
      redirect_to edit_space_document_path(params[:space_npi], @document), notice: "Document version has been saved."
    else
      render :new, status: 422
    end



    # respond_to do |format|
    #   format.json { render json: current_organization.documents, :except => [:sync] }
    #   format.all { head :unprocessable_content }
    # end
  end

  def index
    @document = current_organization.documents.find(params[:document_id])

    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @documents = @space.documents_from_hierarchy

    @versions = @document.versions.order('created_at DESC')
  end

  def show
    @document = current_organization.documents.find(params[:document_id])

    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
    @documents = @space.documents_from_hierarchy

    # todo: refactor to sequential_id
    @version = @document.versions.find(params[:id])
  end
end
