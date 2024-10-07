class RemoveContentFromDocuments < ActiveRecord::Migration[7.1]
  def change
    remove_column :documents, :content
  end
end
