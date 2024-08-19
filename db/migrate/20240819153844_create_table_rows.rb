class CreateTableRows < ActiveRecord::Migration[7.1]
  def change
    create_table :table_rows do |t|
      t.belongs_to :organization, null: false
      t.belongs_to :table, null: false
      t.belongs_to :column, null: false, foreign_key: { to_table: :table_columns }

      t.references :previous_row, foreign_key: { to_table: :table_rows }
    end
  end
end
