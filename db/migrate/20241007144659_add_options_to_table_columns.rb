class AddOptionsToTableColumns < ActiveRecord::Migration[7.1]
  def change
    add_column :table_columns, :options, :json
  end
end
