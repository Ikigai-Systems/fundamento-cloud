class AddArchivedToDocuments < ActiveRecord::Migration[7.1]
  def change
    add_column :documents, :archived, :boolean, default: false
  end
end
