class AddContentHtmlToDocuments < ActiveRecord::Migration[7.1]
  def change
    add_column :documents, :content_html, :text, default: ""
    add_column :documents, :revisions, :json, default: ""
  end
end
