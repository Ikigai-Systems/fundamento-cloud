class RenameSupermenToSuperintendents < ActiveRecord::Migration[7.1]
  def change
    rename_table :supermen, :superintendents
  end
end
