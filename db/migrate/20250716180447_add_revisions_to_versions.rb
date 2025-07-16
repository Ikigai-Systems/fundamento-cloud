class AddRevisionsToVersions < ActiveRecord::Migration[7.1]
  def change
    add_column :versions, :revisions, :json, default: ""
  end
end
