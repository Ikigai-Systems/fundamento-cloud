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
    Turbo::StreamsChannel.broadcast_replace_to(
      ["import_session", session],
      target: "import_session_#{session.id}_status",
      partial: "imports/session_status",
      locals: { session: session }
    )
  end
end
