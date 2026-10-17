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
    # documents already imported unchanged into this space, and one for stored files the
    # importer could already open.
    existing_files = session.import_files.index_by(&:relative_path)
    unchanged_documents = ImportFile
      .joins(:import_session)
      .where(import_sessions: { space_id: session.space_id }, status: ImportFile.statuses[:completed])
      .where.not(import_session_id: session.id)
      .document
      .pluck(:relative_path, :checksum)
      .to_set
    stored_blobs = readable_blobs_matching(file_entries)

    results = file_entries.map { |entry|
      process_manifest_entry(session, entry, existing_files:, unchanged_documents:, stored_blobs:)
    }

    session.update!(status: :uploading)

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

  def process_manifest_entry(session, entry, existing_files: {}, unchanged_documents: Set.new, stored_blobs: {})
    import_file = existing_files[entry[:relative_path]] ||
      session.import_files.build(relative_path: entry[:relative_path])

    if import_file.persisted? &&
        import_file.uploaded? &&
        import_file.checksum == entry[:checksum]
      return file_json(import_file).merge(direct_upload_url: nil, signed_blob_id: nil)
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

    if import_file.document? && unchanged_documents.include?([entry[:relative_path], entry[:checksum]])
      import_file.status = :skipped
      import_file.save!
      return file_json(import_file).merge(direct_upload_url: nil, signed_blob_id: nil, skipped_reason: "already_imported")
    end

    # Bytes already stored are reused rather than uploaded again, wherever and under whatever
    # name they were stored. Only the transfer is skipped: the file still goes through
    # ImportAttachmentJob, which binds it to this import's documents. Skipping it outright
    # used to leave those documents with raw links to it.
    if import_file.attachment? && (blob = stored_blobs[[entry[:checksum], entry[:file_size].to_i]])
      import_file.assign_attributes(status: :uploaded, uploaded_at: Time.current)
      import_file.file.attach(blob)
      import_file.save!
      return file_json(import_file).merge(direct_upload_url: nil, signed_blob_id: nil, skipped_reason: "already_uploaded")
    end

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

  # Stored blobs the client may reuse, keyed by [checksum, byte_size].
  #
  # The client only *claims* to have these bytes: it sends a checksum and never uploads them.
  # So only blobs it could already open are offered — those attached in spaces it can read.
  # Matching across the whole organization would hand anyone who learned a checksum the file
  # behind it, from a space they cannot see.
  #
  # MD5 is enough within that boundary. A collision needs both files crafted together, so it
  # can only ever produce content the person who crafted them already had.
  def readable_blobs_matching(file_entries)
    checksums = file_entries.filter_map { |entry| entry[:checksum].presence }.uniq
    return {} if checksums.empty?

    readable_spaces = policy_scope(current_organization.spaces).select(:id)
    readable_attachments = current_organization.attachments.merge(
      Attachment.where(parent_type: "Space", parent_id: readable_spaces).or(
        Attachment.where(parent_type: "Document", parent_id: Document.kept.where(space_id: readable_spaces).select(:id))
      )
    )

    ActiveStorage::Blob
      .joins(:attachments)
      .where(active_storage_attachments: { name: "file", record_type: "Attachment", record_id: readable_attachments.select(:id) })
      .where(checksum: checksums)
      .distinct
      .index_by { |blob| [blob.checksum, blob.byte_size] }
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
