class RemoveCkeditorColumns < ActiveRecord::Migration[8.1]
  def change
    remove_column :documents, :content_html, :text, default: ""
    remove_column :documents, :operations, :json, default: ""
    remove_column :documents, :revisions, :json, default: ""

    remove_column :versions, :content_html, :text, default: ""
    remove_column :versions, :operations, :json, default: ""
    remove_column :versions, :revisions, :json, default: ""
  end
end
