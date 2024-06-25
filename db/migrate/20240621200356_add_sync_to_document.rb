class AddSyncToDocument < ActiveRecord::Migration[7.1]
  def change
    add_column :documents, :sync, :binary
  end
end
