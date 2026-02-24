class ImportSessionCompletionJob < ApplicationJob
  queue_as :imports

  def perform(session)
    final_status = session.failed_files > 0 ? :partial : :completed
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
