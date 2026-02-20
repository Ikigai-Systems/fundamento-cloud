class ImportAttachmentJob < ApplicationJob
  queue_as :imports

  def perform(import_file)
    return unless import_file.uploaded?

    import_file.update!(status: :processing)
    session = import_file.import_session

    attachment = Attachment.create!(
      organization: session.organization,
      parent: session.space,
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
end
