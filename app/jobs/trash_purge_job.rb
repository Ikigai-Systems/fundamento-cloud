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

  # Discovered rather than listed. A model that starts including Trashable starts being
  # purged because it is trashable, not because someone remembered to add it here --
  # and forgetting would be invisible, since the symptom is trash that silently never
  # expires.
  #
  # eager_load! because in development and test the autoloader has only loaded the
  # constants something has referenced, so descendants is otherwise whatever happens to
  # be in memory. In production eager loading has already happened and this is a no-op.
  #
  # Order does not matter for correctness: purging an organization destroys its documents
  # and tables by cascade, and anything trashed inside a surviving organization is caught
  # by its own model's pass either way. Sorted only so the log reads the same every run.
  def self.purgeable_models
    Rails.application.eager_load!

    ApplicationRecord.descendants.select do |model|
      # `model == model.base_class` skips STI subclasses, whose rows the base class
      # already covers.
      model.include?(Trashable) && model == model.base_class
    end.sort_by(&:name)
  end

  def perform
    cutoff = Trashable::RETENTION.ago

    counts = self.class.purgeable_models.to_h do |model|
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
