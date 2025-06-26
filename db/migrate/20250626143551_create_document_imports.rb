class CreateDocumentImports < ActiveRecord::Migration[7.1]
  def change
    create_table :document_imports do |t|
      t.belongs_to :organization, null: false, foreign_key: true
      t.belongs_to :space, null: false, foreign_key: true
      t.belongs_to :organization_user, null: false, foreign_key: true
      t.belongs_to :document, null: true, foreign_key: true

      t.timestamps
    end
  end
end