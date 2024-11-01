class CreateFavorites < ActiveRecord::Migration[7.1]
  def change
    create_table :favorites do |t|
      t.belongs_to :organization_user, null: false, foreign_key: true

      t.belongs_to :object, polymorphic: true, null: false

      t.index [:object_id, :object_type, :organization_user_id], unique: true

      t.string :npi, null: false

      t.timestamps
    end
  end
end
