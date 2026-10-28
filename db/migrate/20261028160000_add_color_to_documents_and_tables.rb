class AddColorToDocumentsAndTables < ActiveRecord::Migration[8.1]
  def change
    add_column :documents, :color, :integer
    add_column :tables, :color, :integer
  end
end
