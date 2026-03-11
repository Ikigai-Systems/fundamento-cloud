class ImportAttachmentJob < ApplicationJob
  queue_as :imports

  def perform(import_file)
    return unless import_file.uploaded?

    import_file.update!(status: :processing)
    session = import_file.import_session

    parent_document = find_parent_document(import_file, session)

    attachment = Attachment.create!(
      organization: session.organization,
      parent: parent_document,
      filename: import_file.filename,
      mime_type: import_file.file.blob.content_type
    )
    attachment.file.attach(import_file.file.blob)

    import_file.update!(
      status: :completed,
      processed_at: Time.current
    )

    # Store as "attachment:<id>" so BlockNote nodes can reference via createFileUrlResolver
    session.merge_path_map!(import_file.relative_path, "attachment:#{attachment.id}")
    session.increment_counter!(:processed_files)

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
