# Extends the trash from organizations to the two other things a user can destroy
# outright: documents and tables.
#
# The unique index on tables has to be rewritten as partial. Without that, trashing a
# table called "Budget" and creating a new one with the same name fails on the index --
# the trash would silently hold the name hostage for the whole retention window, which
# turns a recoverable delete into a worse experience than the irreversible one it
# replaced. Documents have no name uniqueness, so they need no equivalent.
class AddTrashToDocumentsAndTables < ActiveRecord::Migration[8.1]
  def change
    add_column :documents, :deleted_at, :datetime
    add_column :documents, :deleted_by_id, :string
    add_index :documents, :deleted_at, where: "deleted_at IS NOT NULL"

    add_column :tables, :deleted_at, :datetime
    add_column :tables, :deleted_by_id, :string
    add_index :tables, :deleted_at, where: "deleted_at IS NOT NULL"

    # Name uniqueness now applies only among tables that are still kept.
    remove_index :tables, column: [:name, :space_id], unique: true,
      name: "index_tables_on_name_and_space_id"
    add_index :tables, [:name, :space_id], unique: true,
      where: "deleted_at IS NULL",
      name: "index_tables_on_name_and_space_id"
  end
end
