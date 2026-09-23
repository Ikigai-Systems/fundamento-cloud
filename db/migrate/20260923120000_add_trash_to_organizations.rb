# Deleting an organization is a live product action and, until now, an irreversible one:
# it hard-DELETEs the row and cascades through a dozen associations. Trashing marks the
# row instead, so a mistaken deletion is an UPDATE away from being undone for the length
# of the retention window.
#
# deleted_by_id is deliberately not an FK to users: the person who deleted an
# organization may themselves be removed before the trash is purged, and losing the
# attribution should not block the purge or take the row with it.
class AddTrashToOrganizations < ActiveRecord::Migration[8.1]
  def change
    add_column :organizations, :deleted_at, :datetime
    add_column :organizations, :deleted_by_id, :string

    # Partial: the trash is a small minority of rows, and every query that reads this
    # column is looking for one side or the other of NULL.
    add_index :organizations, :deleted_at, where: "deleted_at IS NOT NULL"
  end
end
