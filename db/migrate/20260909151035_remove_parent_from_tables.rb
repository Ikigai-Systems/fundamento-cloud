# Phase 2 of removing tables.parent / parent_type. Phase 1
# (RelaxTablesParentNullConstraints) stopped writing them and marked them
# ignored_columns; this drops them along with the index nothing queried.
#
# Only safe once the phase 1 release is fully rolled out -- a container still running
# `belongs_to :parent, polymorphic: true` breaks the moment the columns disappear.
class RemoveParentFromTables < ActiveRecord::Migration[8.1]
  def change
    remove_reference :tables, :parent, polymorphic: true
  end
end
