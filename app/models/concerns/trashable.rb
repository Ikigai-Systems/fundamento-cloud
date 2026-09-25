# Soft delete for the handful of records whose deletion is destructive enough to want
# undoing: a trashed record keeps its row and all its children, and is restored with a
# single UPDATE.
#
# There is deliberately no `default_scope`. Blanket soft delete is an anti-pattern --
# every query grows a filter it did not ask for, unique indexes stop meaning what they
# say, and `Model.find` starts lying. Callers that should not see trashed records say so,
# scoping the association itself: `space.documents` is kept-only and `space.all_documents`
# is everything, so the obvious call gets the safe answer and the cascade still reaches
# the trash. Use `.kept` directly only where there is no association to scope.
#
# Trashing touches nothing but the record: no `dependent:` callback fires, no child is
# deleted, no blob is purged. That is the whole point -- it is what makes `untrash!`
# trivial -- and it is why the purge job at the end of the retention window must call a
# real `destroy`, so the cascades that were skipped here finally run.
module Trashable
  extend ActiveSupport::Concern

  # How long a trashed record is recoverable before TrashPurgeJob destroys it for
  # real. Matches the AWS Backup snapshot retention, so the application-level and
  # infrastructure-level recovery windows end at the same point.
  RETENTION = 30.days

  included do
    scope :kept, -> { where(deleted_at: nil) }
    scope :trashed, -> { where.not(deleted_at: nil) }
  end

  def trash!(by: nil)
    update!(deleted_at: Time.current, deleted_by_id: by&.id)
  end

  def untrash!
    update!(deleted_at: nil, deleted_by_id: nil)
  end

  def trashed?
    deleted_at.present?
  end

  def kept?
    !trashed?
  end
end
