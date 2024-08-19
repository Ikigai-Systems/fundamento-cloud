class CreateTableCell < ActiveRecord::Migration[7.1]
  def change
    create_table :table_cells do |t|
      t.belongs_to :organization, null: false
      t.belongs_to :table, null: false
      t.belongs_to :column, null: false, foreign_key: { to_table: :table_columns }
      t.belongs_to :row, null: false, foreign_key: { to_table: :table_rows }

      t.string :value, null: true

      t.timestamps
    end
  end
end
