module ImportSessionActions
  extend ActiveSupport::Concern

  class ImportSessionNotAcceptingFiles < StandardError; end

  included do
    rescue_from ImportSessionNotAcceptingFiles, with: :render_session_not_accepting_files
  end

  private

  def render_session_not_accepting_files(exception)
    render json: { error: exception.message }, status: :unprocessable_entity
  end

  def build_import_session
    space = current_organization.spaces.find(params[:space_id])
    current_organization.import_sessions.build(
      space: space,
      organization_membership: current_organization_membership,
      source_format: params[:source_format] || "generic",
      settings: params[:settings] || {}
    )
  end

  def process_manifest(session)
    unless session.pending? || session.uploading?
      raise ImportSessionNotAcceptingFiles, "Cannot add files to a session that is #{session.status}"
    end

    file_entries = Array(params[:files])

    # Pre-fetch to avoid N+1: one query for existing files in this session, one for
    # files already completed in previous sessions for the same space.
    existing_files = session.import_files.index_by(&:relative_path)
    completed_elsewhere = ImportFile
      .joins(:import_session)
      .where(import_sessions: { space_id: session.space_id }, status: ImportFile.statuses[:completed])
      .where.not(import_session_id: session.id)
      .pluck(:relative_path, :checksum)
      .to_set

    results = file_entries.map { |entry|
      process_manifest_entry(session, entry, existing_files:, completed_elsewhere:)
    }

    session.update!(
      total_files: session.import_files.count,
      skipped_files: session.import_files.where(status: :skipped).count,
      status: :uploading
    )

    results
  end

  # Returns nil on success, or an error message string on validation failure.
  def validate_and_trigger_processing(session)
    still_pending = session.import_files.where(status: [:pending, :uploading]).count
    if still_pending > 0
      return "#{still_pending} files not yet uploaded"
    end

    if session.processing? || session.completed?
      return "Session is already #{session.status}"
    end

    session.update!(status: :processing, started_processing_at: Time.current)
    ImportSessionOrchestratorJob.perform_later(session)
    nil
  end

  def process_manifest_entry(session, entry, existing_files: {}, completed_elsewhere: Set.new)
    import_file = existing_files[entry[:relative_path]] ||
      session.import_files.build(relative_path: entry[:relative_path])

    if import_file.persisted? &&
        import_file.uploaded? &&
        import_file.checksum == entry[:checksum]
      return file_json(import_file).merge(direct_upload_url: nil, signed_blob_id: nil)
    end

    # Skip files already imported in a previous session for this space
    already_imported = completed_elsewhere.include?([entry[:relative_path], entry[:checksum]])

    if already_imported
      import_file.assign_attributes(status: :skipped)
      import_file.save!
      return file_json(import_file).merge(direct_upload_url: nil, signed_blob_id: nil, skipped_reason: "already_imported")
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
