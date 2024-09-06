class CreateTeams < ActiveRecord::Migration[7.1]
  def change
    create_table :teams do |t|
      t.belongs_to :organization, null: false, foreign_key: true

      t.string :name, null: false
      t.string :shortcut, null: false

      t.timestamps

      t.index [:shortcut, :organization_id], unique: true
      t.index [:name, :organization_id], unique: true
    end
  end
end
