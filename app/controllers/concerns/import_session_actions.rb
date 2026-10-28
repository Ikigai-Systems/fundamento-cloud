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
    # files already imported in previous sessions for the same space.
    existing_files = session.import_files.index_by(&:relative_path)
    imported_before = previously_imported(session)

    results = file_entries.map { |entry|
      process_manifest_entry(session, entry, existing_files:, previously_imported: imported_before)
    }

    session.update!(status: :uploading)

    results
  end

  # Set of [relative_path, checksum] for files that earlier sessions in this space imported
  # and whose result is still there. A completed ImportFile outlives what it produced, so a
  # document or attachment that was deleted (or is in the trash) since must not make the same
  # file skip: the user is importing it again because it is gone.
  #
  # What each file produced is in its session's path_map: a document id, or
  # "attachment:<id>.<ext>".
  def previously_imported(session)
    rows = ImportFile
      .joins(:import_session)
      .where(import_sessions: { space_id: session.space_id }, status: ImportFile.statuses[:completed])
      .where.not(import_session_id: session.id)
      .pluck(:relative_path, :checksum, Arel.sql("import_sessions.path_map ->> import_files.relative_path"))

    # "attachment:<id>.<ext>" -> "attachment:<id>"; a document id stays as it is.
    produced = rows.map { |_, _, object|
      object&.start_with?("attachment:") ? object.delete_suffix(File.extname(object)) : object
    }
    attachment_ids = produced.compact.select { |object| object.start_with?("attachment:") }
    document_ids = produced.compact - attachment_ids

    still_there = session.space.documents.where(id: document_ids).pluck(:id).to_set
    still_there.merge(
      session.organization.attachments.where(id: attachment_ids.map { |object| object.delete_prefix("attachment:") })
        .pluck(:id).map { |id| "attachment:#{id}" }
    )

    rows.zip(produced).each_with_object(Set.new) do |((path, checksum, _), object), result|
      result << [path, checksum] if still_there.include?(object)
    end
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

  def process_manifest_entry(session, entry, existing_files: {}, previously_imported: Set.new)
    import_file = existing_files[entry[:relative_path]] ||
      session.import_files.build(relative_path: entry[:relative_path])

    if import_file.persisted? &&
        import_file.uploaded? &&
        import_file.checksum == entry[:checksum]
      return file_json(import_file).merge(direct_upload_url: nil, signed_blob_id: nil)
    end

    # Skip files already imported in a previous session for this space
    already_imported = previously_imported.include?([entry[:relative_path], entry[:checksum]])

    if already_imported
      import_file.assign_attributes(status: :skipped)
      import_file.save!
      return file_json(import_file).merge(direct_upload_url: nil, signed_blob_id: nil, skipped_reason: "already_imported")
    end

    # The client's own `format`/`file_type` are ignored: it reports the path, the server
    # decides what to do with it. See ImportFile.classify.
    file_type, format = ImportFile.classify(entry[:relative_path])

    import_file.assign_attributes(
      checksum: entry[:checksum],
      file_size: entry[:file_size].to_i,
      format: format,
      file_type: file_type,
      status: :pending
    )
    blob = ActiveStorage::Blob.create_before_direct_upload!(
      filename: File.basename(entry[:relative_path].to_s),
      byte_size: entry[:file_size].to_i,
      checksum: entry[:checksum],
      content_type: content_type_for_format(format)
    )

    import_file.blob_signed_id = blob.signed_id
    import_file.save!

    file_json(import_file).merge(
      direct_upload_url: blob.service_url_for_direct_upload(expires_in: 24.hours),
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
