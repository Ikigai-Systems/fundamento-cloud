class AddBlobSignedIdToImportFiles < ActiveRecord::Migration[8.1]
  def change
    add_column :import_files, :blob_signed_id, :string
  end
end
