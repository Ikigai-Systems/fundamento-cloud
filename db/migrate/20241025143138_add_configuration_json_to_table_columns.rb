class AddConfigurationJsonToTableColumns < ActiveRecord::Migration[7.1]
  def change
    add_column :table_columns, :configuration, :json
  end
end
