class AddNpiToDocuments < ActiveRecord::Migration[7.1]
  def change
    add_column :documents, :npi, :string, null: false, default: -> { "gen_random_uuid()" }
    add_index :documents, :npi, unique: true
  end
end
