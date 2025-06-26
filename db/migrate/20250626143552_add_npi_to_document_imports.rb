class AddNpiToDocumentImports < ActiveRecord::Migration[7.1]
  def change
    add_column :document_imports, :npi, :string, null: false, default: -> { "gen_random_uuid()" }
    add_index :document_imports, :npi, unique: true
  end
end
