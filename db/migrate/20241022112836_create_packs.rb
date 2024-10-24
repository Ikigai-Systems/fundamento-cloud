class CreatePacks < ActiveRecord::Migration[7.1]
  def change
    create_table :packs do |t|
      t.belongs_to :organization, null: false, foreign_key: true

      t.string :name, null: false
      t.string :description, null: false, default: ''

      t.string :npi, null: false, default: -> { "gen_random_uuid()" }

      t.timestamps

      t.index :npi, unique: true
    end
  end
end
