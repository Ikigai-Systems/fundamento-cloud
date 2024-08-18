class CreateTables < ActiveRecord::Migration[7.1]
  def change
    create_table :tables do |t|
      t.belongs_to :organization, null: false
      t.belongs_to :space, null: false

      t.belongs_to :parent, polymorphic: true, null: false

      t.string :name, null: false
      t.boolean :archived, default: false, null: false

      t.timestamps

      t.index [:name, :space_id, :organization_id], unique: true
    end
  end
end
