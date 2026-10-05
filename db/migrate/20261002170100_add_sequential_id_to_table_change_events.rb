# Gives table_change_events a per-table counter, which does two jobs at once.
#
# 1. It is the unique key a restore matches on, so archived change events can go back without
#    the restore having to guess whether it has seen them before. (pack_versions got the same
#    treatment one migration earlier; the other six tables needed a string primary key.)
#
# 2. It replaces `order(:id)` as the log's ordering. That was already wrong for restored rows:
#    a restored event is reassigned a fresh id from a sequence shared across every tenant, so
#    it sorted last no matter when it actually happened. sequential_id is carried across an
#    archive verbatim and sorts correctly.
#
# The counter is assigned the way Version and Tables::Version assign theirs -- an advisory
# lock keyed on the parent -- which also closes a race in Tables::ChangeRecorder: two writers
# to one table could both read the same "immediately preceding event" and both coalesce into it.
#
# The column is added nullable and backfilled rather than created with a `gen_random_uuid()`-
# style default, because a volatile default forces a full table rewrite under ACCESS EXCLUSIVE.
class AddSequentialIdToTableChangeEvents < ActiveRecord::Migration[8.1]
  def up
    add_column :table_change_events, :sequential_id, :integer

    # `id` is the true order today, so it is what the backfill numbers by.
    execute <<~SQL
      UPDATE table_change_events
      SET sequential_id = numbered.row_number
      FROM (
        SELECT id, row_number() OVER (PARTITION BY table_id ORDER BY id) AS row_number
        FROM table_change_events
      ) AS numbered
      WHERE table_change_events.id = numbered.id
    SQL

    change_column_null :table_change_events, :sequential_id, false
    add_index :table_change_events, [:table_id, :sequential_id], unique: true
  end

  def down
    remove_index :table_change_events, [:table_id, :sequential_id]
    remove_column :table_change_events, :sequential_id
  end
end
