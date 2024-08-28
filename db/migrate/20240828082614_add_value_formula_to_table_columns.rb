class AddValueFormulaToTableColumns < ActiveRecord::Migration[7.1]
  def change
    add_column :table_columns, :value_formula, :text
  end
end
