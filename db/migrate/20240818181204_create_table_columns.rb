class CreateTableColumns < ActiveRecord::Migration[7.1]
  def change
    create_table :table_columns do |t|
      t.belongs_to :organization, null: false
      t.belongs_to :table, null: false

      t.string :name, null: false
      t.integer :kind, null: false, limit: 2

      t.references :previous_column, foreign_key: { to_table: :table_columns }

      t.timestamps

      t.index [:name, :table_id], unique: true
    end
  end
end
