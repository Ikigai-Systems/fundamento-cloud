class CreateObjectComments < ActiveRecord::Migration[7.1]
  def change
    create_table :object_comments do |t|
      t.belongs_to :organization, null: false, foreign_key: true
      t.belongs_to :organization_user, null: false, foreign_key: true

      t.belongs_to :object, polymorphic: true, null: false

      t.json :comment, null: false

      t.timestamps
    end
  end
end
