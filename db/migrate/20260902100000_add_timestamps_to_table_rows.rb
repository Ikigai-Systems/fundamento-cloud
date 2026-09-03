# Tables::Row includes NpiOrdering, which sets implicit_order_column = :created_at,
# but table_rows never had timestamps. Any find_each / in_batches over rows therefore
# generated SQL against a column that does not exist. The snapshot builder batches
# over rows, so the columns have to exist before versioning can work.
class AddTimestampsToTableRows < ActiveRecord::Migration[8.1]
  def change
    add_column :table_rows, :created_at, :datetime
    add_column :table_rows, :updated_at, :datetime

    up_only do
      execute <<~SQL
        UPDATE table_rows
        SET created_at = tables.created_at, updated_at = tables.updated_at
        FROM tables
        WHERE table_rows.table_id = tables.id
      SQL

      execute <<~SQL
        UPDATE table_rows
        SET created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE created_at IS NULL
      SQL
    end

    change_column_null :table_rows, :created_at, false
    change_column_null :table_rows, :updated_at, false
  end
end
