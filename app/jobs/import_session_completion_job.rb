class ImportSessionCompletionJob < ApplicationJob
  queue_as :imports

  def perform(session)
    # Files still in :processing at this point are stuck — their jobs were interrupted
    # and re-runs silently no-oped. Treat them as failed so the session reflects reality.
    stuck = session.import_files.where(status: :processing)

    if stuck.any?
      stuck_count = stuck.count
      stuck.update_all(
        status: ImportFile.statuses[:failed],
        error_message: "Processing interrupted unexpectedly",
        processed_at: Time.current
      )

      Sentry.capture_message(
        "Import session completed with stuck files",
        level: :warning,
        extra: {
          session_id: session.id,
          space_id: session.space_id,
          organization_id: session.organization_id,
          stuck_count: stuck_count,
          total_files: session.total_files
        }
      )
    end

    final_status = session.import_files.where(status: :failed).exists? ? :partial : :completed

    session.update!(
      status: final_status,
      completed_processing_at: Time.current
    )

    broadcast_completion(session)
  end

  private

  def broadcast_completion(session)
    Turbo::StreamsChannel.broadcast_refresh_to(["import_session", session])
  end
end
