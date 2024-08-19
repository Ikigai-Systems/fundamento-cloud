class RemoveColumnIdFromTableRows < ActiveRecord::Migration[7.1]
  def change
    remove_belongs_to :table_rows, :column, null: false, foreign_key: { to_table: :table_columns }
  end
end
