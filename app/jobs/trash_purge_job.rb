# Closes the recovery window that Trashable opens.
#
# Trashing deliberately skips every `dependent:` callback, so this is where they finally
# run: `destroy` rather than `delete_all`, one record at a time, so the cascades fire and
# Active Storage gets the chance to purge its blobs.
#
# The selection is `deleted_at <= cutoff` rather than "not null and old enough", which
# is what keeps a future `deleted_at` -- from a clock skew or a bad backfill -- out of
# the purge rather than making it look infinitely old. Worth stating because the obvious
# alternative, comparing an age, fails that case silently.
class TrashPurgeJob < ApplicationJob
  queue_as :maintenance

  # Kept small on purpose: production runs on a burstable instance, and destroying an
  # organization cascades through a dozen associations.
  BATCH_SIZE = 20

  # Organizations first: purging one destroys its documents and tables by cascade, so
  # doing them first means the later passes have less to walk. Anything trashed
  # individually inside a surviving organization is still caught by its own pass.
  PURGEABLE = [Organization, Document, Table].freeze

  def perform
    cutoff = Trashable::RETENTION.ago

    counts = PURGEABLE.to_h do |model|
      purged = 0

      model.where(deleted_at: ..cutoff).find_each(batch_size: BATCH_SIZE) do |record|
        # `destroy`, not `delete_all`: trashing skipped every `dependent:` callback, and
        # this is where they finally run -- including Active Storage purging its blobs.
        record.destroy!
        purged += 1
      end

      [model.name, purged]
    end

    Rails.logger.info(
      "TrashPurgeJob: purged #{counts.map { |name, n| "#{n} #{name.tableize}" }.join(", ")} " \
      "trashed before #{cutoff.iso8601}"
    )
  end
end
