class CreateObjectVisitors < ActiveRecord::Migration[7.1]
  def change
    create_table :object_visitors do |t|
      t.belongs_to :organization_user

      t.belongs_to :object, null: false, polymorphic: true

      t.datetime :visited_at, null: false

      t.index [:object_id, :object_type, :organization_user_id], unique: true
    end
  end
end
