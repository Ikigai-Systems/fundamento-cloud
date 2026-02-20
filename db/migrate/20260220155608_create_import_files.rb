class CreateImportFiles < ActiveRecord::Migration[8.1]
  def change
    create_table :import_files, id: :string, default: -> { "gen_random_uuid()" } do |t|
      t.belongs_to :import_session, null: false, foreign_key: true, type: :string
      t.belongs_to :document, null: true, foreign_key: true, type: :string

      t.string :relative_path, null: false
      t.integer :file_type, null: false, default: 0
      t.string :format, null: false, default: "other"
      t.integer :status, null: false, default: 0

      t.string :checksum
      t.bigint :file_size

      t.text :error_message
      t.datetime :uploaded_at
      t.datetime :processed_at

      t.timestamps
    end

    add_index :import_files, [:import_session_id, :status]
    add_index :import_files, [:import_session_id, :checksum]
    add_index :import_files, [:import_session_id, :relative_path], unique: true
  end
end
