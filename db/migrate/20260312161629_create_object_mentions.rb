class CreateObjectMentions < ActiveRecord::Migration[8.1]
  def change
    create_table :object_mentions, id: :string do |t|
      t.string :source_type, null: false
      t.string :source_id, null: false
      t.string :target_type, null: false
      t.string :target_id
      t.string :title, null: false
      t.boolean :current, null: false, default: true
      t.belongs_to :organization, type: :string, null: false, foreign_key: true

      t.timestamps
    end

    add_index :object_mentions, [:source_type, :source_id]
    add_index :object_mentions, [:target_type, :target_id]
  end
end
