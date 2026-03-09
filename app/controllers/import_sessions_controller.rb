class ImportSessionsController < ApplicationController
  include EnsureOrganization

  after_action :verify_authorized

  before_action :set_session, only: [:show, :manifest, :trigger_processing]

  def index
    @sessions = policy_scope(current_organization.import_sessions).recent
                  .includes(:space, :organization_membership)

    authorize ImportSession, :index?
  end

  def show
    authorize @session, :show?
    @import_files = @session.import_files.order(:relative_path)
  end

  def new
    @session = current_organization.import_sessions.new
    @spaces = updatable_spaces
    authorize @session, :create?
  end

  def create
    space = current_organization.spaces.find(params[:space_id])
    @session = current_organization.import_sessions.build(
      space: space,
      organization_membership: current_organization_membership,
      source_format: params[:source_format] || "generic",
      settings: params[:settings] || {}
    )

    authorize @session

    @session.save!

    render json: session_json(@session), status: :created
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Space not found" }, status: :not_found
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
  end

  def manifest
    authorize @session, :update?

    file_entries = Array(params[:files])
    results = file_entries.map { |entry| process_manifest_entry(@session, entry) }

    @session.update!(
      total_files: @session.import_files.count,
      status: :uploading
    )

    render json: results
  end

  def trigger_processing
    authorize @session, :update?

    still_pending = @session.import_files.where(status: [:pending, :uploading]).count
    if still_pending > 0
      return render json: { error: "#{still_pending} files not yet uploaded" },
                    status: :unprocessable_entity
    end

    if @session.processing? || @session.completed?
      return render json: { error: "Session is already #{@session.status}" },
                    status: :unprocessable_entity
    end

    @session.update!(status: :processing, started_processing_at: Time.current)
    ImportSessionOrchestratorJob.perform_later(@session)

    render json: session_json(@session)
  end

  private

  def set_session
    @session = current_organization.import_sessions.find(params[:id])
  end

  def updatable_spaces
    policy_scope(current_organization.spaces).select do |space|
      policy(space).update?
    end
  end

  def session_json(session)
    {
      id: session.id,
      status: session.status,
      source_format: session.source_format,
      total_files: session.total_files,
      uploaded_files: session.uploaded_files,
      processed_files: session.processed_files,
      failed_files: session.failed_files
    }
  end

  def process_manifest_entry(session, entry)
    import_file = session.import_files.find_or_initialize_by(
      relative_path: entry[:relative_path]
    )

    if import_file.persisted? &&
        import_file.uploaded? &&
        import_file.checksum == entry[:checksum]
      return file_json(import_file).merge(direct_upload_url: nil, signed_blob_id: nil)
    end

    import_file.assign_attributes(
      checksum: entry[:checksum],
      file_size: entry[:file_size].to_i,
      format: entry[:format],
      file_type: entry[:file_type],
      status: :pending
    )
    blob = ActiveStorage::Blob.create_before_direct_upload!(
      filename: File.basename(entry[:relative_path].to_s),
      byte_size: entry[:file_size].to_i,
      checksum: entry[:checksum],
      content_type: content_type_for_format(entry[:format])
    )

    import_file.blob_signed_id = blob.signed_id
    import_file.save!

    file_json(import_file).merge(
      direct_upload_url: blob.service_url_for_direct_upload,
      direct_upload_headers: blob.service.headers_for_direct_upload(
        blob.key, content_type: blob.content_type, checksum: blob.checksum
      ).compact,
      content_type: blob.content_type,
      signed_blob_id: blob.signed_id
    )
  end

  def file_json(file)
    {
      id: file.id,
      relative_path: file.relative_path,
      file_type: file.file_type,
      format: file.format,
      status: file.status,
      checksum: file.checksum,
      file_size: file.file_size
    }
  end

  def content_type_for_format(format)
    case format.to_s
    when "markdown" then "text/markdown"
    when "docx" then "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    when "odt" then "application/vnd.oasis.opendocument.text"
    when "image" then "image/*"
    when "pdf" then "application/pdf"
    when "video" then "video/*"
    else "application/octet-stream"
    end
  end
end
