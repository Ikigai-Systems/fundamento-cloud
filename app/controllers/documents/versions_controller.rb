class Documents::VersionsController < ApplicationController
  include EnsureOrganization

  layout -> { turbo_frame_request? ? "turbo_rails/frame" : "content_two_sidebars" }

  include LoadDocument.from_param(:document_npi)

  after_action :verify_authorized

  before_action :load_document

  def create
    content_blocks = JSON.parse(params["content_blocks"].to_s)
    content_html = params["content_html"]
    revisions = params["revisions"]

    authorize @document, :update?

    if ENV["BLOCKNOTE_DIFF"].to_bool
      blocks2 = @document.to_blocks
      # pp JSON.pretty_generate(blocks2)

      diff = HashDiff.diff(blocks, blocks2)
      if diff.present?
        Sentry.capture_message("XmlfragmentToBlock mismatch for #{@space.id} / #{@document.id} (call stefan) : #{diff}")
        flash[:warning] = "Detected document desynchronization between your local version and server. This might mean network connection problems, server performance problems or someone else editing the document concurrently. Proceeding with saving your local version."
      end
    end

    @version = @document.versions.new
    @version.content_blocks = content_blocks
    @version.content_html = content_html
    @version.revisions = revisions
    @version.created_by = current_user

    if @version.save
      @document.update(
        {
          content_html: content_html,
          revisions: revisions,
          operations: nil,
        }
      )

      respond_to do |format|
        flash[:notice] = "Document has been updated."
        format.html { redirect_to document_path(@document) }
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
    authorize @document, :show?

    @documents = @space.documents_from_hierarchy

    @versions = @document.versions.order('created_at DESC')

    render layout: "full_width_application"
  end

  def show
    authorize @document, :show?

    if params[:id] == "latest"
      @version = @document.versions.latest
    else
      @version = @document.versions.find_by(sequential_id: params[:id])
    end
    raise ActionController::RoutingError, 'Not Found' if @version.blank?

    @documents = @space.documents_from_hierarchy

    @versions = @document.versions.order('created_at DESC')
  end

  def update
    authorize @document, :update?

    @version = @document.versions.find_by(sequential_id: params[:id])

    @version.update(
      {
        content_html: params[:content_html],
        operations: params[:operations],
      }
    )

    head :no_content
  end
end
