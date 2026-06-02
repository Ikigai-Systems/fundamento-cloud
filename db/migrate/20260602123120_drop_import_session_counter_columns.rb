class DropImportSessionCounterColumns < ActiveRecord::Migration[8.1]
  def change
    remove_column :import_sessions, :total_files, :integer, default: 0, null: false
    remove_column :import_sessions, :uploaded_files, :integer, default: 0, null: false
    remove_column :import_sessions, :processed_files, :integer, default: 0, null: false
    remove_column :import_sessions, :failed_files, :integer, default: 0, null: false
    remove_column :import_sessions, :skipped_files, :integer, default: 0, null: false
  end
end
