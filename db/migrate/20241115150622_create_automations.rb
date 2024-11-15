class CreateAutomations < ActiveRecord::Migration[7.1]
  def change
    create_table :automations do |t|
      t.belongs_to :organization, foreign_key: true
      t.belongs_to :space, foreign_key: true

      t.string :title, null: false

      t.integer :kind, null: false, limit: 2

      t.string :formula, null: true
      t.string :npi, null: true

      t.timestamps

      t.index [:title, :space_id], unique: true
    end
  end
end
