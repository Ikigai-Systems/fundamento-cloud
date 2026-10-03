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
      # Released one file at a time rather than left to dependent: :destroy, which would purge
      # blobs an imported document's attachment still points at. See
      # ImportFile#release_source_file!.
      session.import_files.each(&:release_source_file!)
      session.destroy!
      removed += 1
    end

    Rails.logger.info "ImportSessionCleanupJob: removed #{removed} #{label} session(s)"
  end
end
