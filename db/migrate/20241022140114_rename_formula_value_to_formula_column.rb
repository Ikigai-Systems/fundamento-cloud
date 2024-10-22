class RenameFormulaValueToFormulaColumn < ActiveRecord::Migration[7.1]
  def change
    rename_column :table_columns, :value_formula, :formula
  end
end
