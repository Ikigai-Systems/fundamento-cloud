class DropDocumentImports < ActiveRecord::Migration[8.1]
  def up
    drop_table :document_imports
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
