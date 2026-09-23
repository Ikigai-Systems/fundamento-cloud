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

  def perform
    cutoff = Trashable::RETENTION.ago
    purged = 0

    Organization.trashed
      .where(deleted_at: ..cutoff)
      .find_each(batch_size: BATCH_SIZE) do |organization|
        organization.destroy!
        purged += 1
      end

    Rails.logger.info "TrashPurgeJob: purged #{purged} organizations trashed before #{cutoff.iso8601}"
  end
end
