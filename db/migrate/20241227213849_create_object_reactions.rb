class CreateObjectReactions < ActiveRecord::Migration[7.1]
  def change
    create_table :object_reactions do |t|
      t.belongs_to :organization, null: false, foreign_key: true
      t.belongs_to :organization_user, null: false, foreign_key: true

      t.belongs_to :object, polymorphic: true, null: false

      t.string :emoji, null: false

      t.datetime :created_at, null: false

      t.index [:emoji, :object_id, :object_type, :organization_user_id], unique: true
    end
  end
end
