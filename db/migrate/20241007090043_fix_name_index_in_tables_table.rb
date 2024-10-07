class FixNameIndexInTablesTable < ActiveRecord::Migration[7.1]
  def change
    remove_index :tables, [:name, :space_id, :organization_id]
    add_index :tables, [:space_id, :name], unique: true

    # todo: ask Paweł about the order of multi-column index, i.e. in table-columns we have "name" then "table_id", in spaces we have :name,:organization_id
  end
end
