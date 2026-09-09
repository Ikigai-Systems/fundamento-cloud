# Phase 1 of removing tables.parent / parent_type. Tables have no hierarchy: the sidebar
# lists them flat and alphabetically, and nothing reads the association.
#
# Rolling deploys mean containers running the previous release keep executing
# `belongs_to :parent, polymorphic: true` against this schema, so the columns cannot be
# dropped yet. Relaxing NOT NULL is what lets the new code stop writing them: with
# `ignored_columns` set, Rails omits both from its INSERTs, and a NOT NULL column with no
# default would reject every table creation and every fixture load.
#
# The columns themselves go in a follow-up, once this release is fully rolled out.
class RelaxTablesParentNullConstraints < ActiveRecord::Migration[8.1]
  def change
    change_column_null :tables, :parent_id, true
    change_column_null :tables, :parent_type, true
  end
end
