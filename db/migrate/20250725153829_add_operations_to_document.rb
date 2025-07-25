class AddOperationsToDocument < ActiveRecord::Migration[7.1]
  def change
    add_column :documents, :operations, :json, default: ""
  end
end
