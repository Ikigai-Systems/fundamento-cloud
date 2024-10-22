class CreatePackVersions < ActiveRecord::Migration[7.1]
  def change
    create_table :pack_versions do |t|
      t.belongs_to :organization, null: false, foreign_key: true
      t.belongs_to :pack, null: false, foreign_key: true
      # t.belongs_to :built_by, null: false, foreign_key: { to_table: :organizations_users }

      t.string :description, null: false, default: ''
      t.integer :version, null: false, default: 1

      t.timestamps
    end
  end
end
