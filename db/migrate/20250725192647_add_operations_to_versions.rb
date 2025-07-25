class AddOperationsToVersions < ActiveRecord::Migration[7.1]
  def change
    add_column :versions, :operations, :json, default: ""
  end
end
