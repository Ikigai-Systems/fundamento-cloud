class Documents::VersionsController < ApplicationController
  include EnsureOrganization

  layout -> { content_layout }

  include LoadDocument.from_param(:document_id)

  after_action :verify_authorized

  before_action :load_document

  def create
    authorize @document, :update?

    content_blocks = parsed_content_blocks
    return reject_unloaded_content if content_blocks.nil?

    if ENV["BLOCKNOTE_DIFF"].to_bool
      blocks2 = @document.to_blocks
      # pp JSON.pretty_generate(blocks2)

      diff = HashDiff.diff(blocks, blocks2)
      if diff.present?
        Sentry.capture_message("XmlfragmentToBlock mismatch for #{@space.id} / #{@document.id}: #{diff}")
        flash[:alert] = "Detected document desynchronization between your local version and server. This might mean network connection problems, server performance problems or someone else editing the document concurrently. Proceeding with saving your local version."
      end
    end

    @version = @document.versions.new
    @version.content_blocks = content_blocks
    @version.created_by = current_user

    if @version.save
      @document.editing_sessions.unlinked.update_all(version_id: @version.id)

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

    @versions = @document.versions.includes(:created_by, editing_sessions: { member: :user }).order('created_at DESC')

    render layout: content_layout(full: "full_width_application", frame: "full_width_frame")
  end

  def show
    authorize @document, :show?

    if params[:id] == "latest"
      @version = @document.versions.latest
    else
      @version = @document.versions.find_by(sequential_id: params[:id])
    end
    raise ActionController::RoutingError, 'Not Found' if @version.blank?

    @versions = @document.versions.includes(editing_sessions: { member: :user }).order('created_at DESC')
  end

  def update
    authorize @document, :update?

    @version = @document.versions.find_by(sequential_id: params[:id])

    head :no_content
  end

  private

  # The editor fills content_blocks once it has loaded the document, and only then enables the
  # save button. Anything else means the form went before that; saving it would replace the
  # document with nothing.
  def parsed_content_blocks
    blocks = JSON.parse(params[:content_blocks].to_s)
    blocks if blocks.is_a?(Array)
  rescue JSON::ParserError
    nil
  end

  def reject_unloaded_content
    message = "The editor was still loading, so nothing was saved. Please try again."

    respond_to do |format|
      format.html { redirect_to edit_document_path(@document), alert: message }
      format.turbo_stream do
        flash.now[:alert] = message
        render turbo_stream: turbo_stream.append("flashes", partial: "flash_messages_as_alerts", locals: { flash: flash }),
          status: :unprocessable_content
      end
    end
  end
end
