class ImportSessionCleanupJob < ApplicationJob
  queue_as :maintenance

  def perform
    remove ImportSession.expired, "abandoned"
    remove ImportSession.finished_and_stale, "finished"
  end

  private

  # Counted as we go: the old version logged `scope.count` after destroying everything, which
  # re-ran the query and reported zero.
  def remove(sessions, label)
    removed = 0

    sessions.find_each do |session|
      # An import's source blob is often shared with the Attachment it created
      # (ImportDocumentJob#attach_source_file). Destroying the session still purges it, and that
      # is safe: Active Storage refuses to destroy a blob any attachment still names, so only
      # sources nothing else uses are removed. spec/models/import_session_spec.rb holds that.
      session.destroy!
      removed += 1
    end

    Rails.logger.info "ImportSessionCleanupJob: removed #{removed} #{label} session(s)"
  end
end
