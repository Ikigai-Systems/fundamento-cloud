class CreateImportSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :import_sessions, id: :string, default: -> { "gen_random_uuid()" } do |t|
      t.belongs_to :organization, null: false, foreign_key: true, type: :string
      t.belongs_to :space, null: false, foreign_key: true, type: :string
      t.belongs_to :organization_membership, null: false, foreign_key: true, type: :string

      t.integer :status, null: false, default: 0
      t.string :source_format, null: false, default: "generic"

      t.integer :total_files, null: false, default: 0
      t.integer :uploaded_files, null: false, default: 0
      t.integer :processed_files, null: false, default: 0
      t.integer :failed_files, null: false, default: 0
      t.integer :skipped_files, null: false, default: 0

      t.jsonb :path_map, null: false, default: {}
      t.jsonb :settings, null: false, default: {}

      t.datetime :expires_at, null: false
      t.datetime :started_processing_at
      t.datetime :completed_processing_at

      t.timestamps
    end

    add_index :import_sessions, :status
    add_index :import_sessions, :expires_at
  end
end
