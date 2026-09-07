# Guard column for compare-and-swap updates of spaces.hierarchy.
#
# Deliberately not called `lock_version`: Rails turns on optimistic locking for a model as
# soon as a column by that name exists, which would make every unrelated writer
# (archive/unarchive, rename, the spaces controllers) able to raise StaleObjectError. None
# of them handle it. This column is read and bumped explicitly by
# Space#insert_hierarchy_node! and Space#with_locked_hierarchy instead, so the guard stays
# scoped to hierarchy writes.
class AddHierarchyVersionToSpaces < ActiveRecord::Migration[8.1]
  def change
    add_column :spaces, :hierarchy_version, :integer, default: 0, null: false
  end
end
