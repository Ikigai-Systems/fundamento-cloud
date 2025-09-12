class CreateObjectTags < ActiveRecord::Migration[7.1]
  def change
    create_table :object_tags do |t|
      t.belongs_to :organization, null: false, foreign_key: true
      t.belongs_to :tag, null: false, foreign_key: true
      t.string :object_type, null: false
      t.bigint :object_id, null: false

      t.timestamps
      
      t.index [:object_type, :object_id], name: "index_object_tags_on_object"
      t.index [:tag_id, :object_type, :object_id], unique: true
    end
  end
end
