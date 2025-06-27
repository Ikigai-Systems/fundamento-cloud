class AddImportedFieldsToDocumentImports < ActiveRecord::Migration[7.1]
  def change
    add_column :document_imports, :imported_at, :datetime
    add_column :document_imports, :imported_content, :text

    add_index :document_imports, :imported_at
  end
end