class CreateTags < ActiveRecord::Migration[7.1]
  def change
    create_table :tags do |t|
      t.belongs_to :organization, null: false, foreign_key: true
      t.belongs_to :space, null: false, foreign_key: true
      
      t.string :name, null: false
      t.string :npi, default: -> { "gen_random_uuid()" }, null: false
      t.string :color

      t.timestamps
      
      t.index [:name, :space_id], unique: true
      t.index :npi, unique: true
    end
  end
end
