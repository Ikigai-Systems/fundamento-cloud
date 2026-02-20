class ImportSessionCleanupJob < ApplicationJob
  queue_as :maintenance

  def perform
    expired_sessions = ImportSession.expired

    expired_sessions.find_each do |session|
      # Active Storage blobs are cleaned up via dependent: :destroy on ImportFile
      # which triggers has_one_attached cleanup
      session.destroy!
    end

    Rails.logger.info "ImportSessionCleanupJob: cleaned up #{expired_sessions.count} expired sessions"
  end
end
