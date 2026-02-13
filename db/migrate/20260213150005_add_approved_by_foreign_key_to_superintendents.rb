class AddApprovedByForeignKeyToSuperintendents < ActiveRecord::Migration[8.1]
  def change
    add_foreign_key :superintendents, :superintendents, column: :approved_by_id
  end
end
