class ImportAttachmentJob < ApplicationJob
  queue_as :imports

  def perform(import_file)
    # Allow retry from :processing — see ImportDocumentJob for explanation
    return if import_file.completed? || import_file.failed? || import_file.skipped?

    import_file.update!(status: :processing)
    session = import_file.import_session

    parent_document = find_parent_document(import_file, session)

    ActiveRecord::Base.transaction do
      # Serialize concurrent threads — same rationale as ImportDocumentJob.
      locked_file = ImportFile.lock.find(import_file.id)
      raise ActiveRecord::Rollback if locked_file.completed? || locked_file.failed? || locked_file.skipped?

      attachment = Attachment.create!(
        organization: session.organization,
        parent: parent_document,
        filename: import_file.filename,
        mime_type: import_file.file.blob.content_type
      )
      attachment.file.attach(import_file.file.blob)

      locked_file.update!(
        status: :completed,
        document: parent_document.is_a?(Document) ? parent_document : nil,
        processed_at: Time.current
      )

      # Store as "attachment:<id>.<ext>" so BlockNote can detect the media type from the extension
      ext = File.extname(import_file.relative_path)
      session.merge_path_map!(import_file.relative_path, "attachment:#{attachment.id}#{ext}")
      session.increment_counter!(:processed_files)
    end

  rescue StandardError => e
    import_file.update!(
      status: :failed,
      error_message: e.message,
      processed_at: Time.current
    )
    session.increment_counter!(:failed_files)
  end

  private

  def find_parent_document(import_file, session)
    dir_path = File.dirname(import_file.relative_path)
    path_map = session.path_map

    # Walk up the directory tree to find the closest folder document
    while dir_path != "."
      doc_id = path_map[dir_path]
      return Document.find(doc_id) if doc_id.present?
      dir_path = File.dirname(dir_path)
    end

    # Last resort: space home document, then space itself
    session.space.home_document || session.space
  end
end
