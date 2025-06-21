class AddContentHtmlToVersions < ActiveRecord::Migration[7.1]
  def change
    add_column :versions, :content_html, :text, default: ""
    rename_column :versions, :content, :content_blocks
  end
end
