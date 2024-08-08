class AddHomeDocumentIdToSpaces < ActiveRecord::Migration[7.1]
  def change
    add_reference :spaces, :home_document, null: true, index: false, foreign_key: { to_table: :documents }
  end
end
