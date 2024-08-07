class AddSpaceIdToDocuments < ActiveRecord::Migration[7.1]
  def change
    add_belongs_to :documents, :space, foreign_key: true, null: true
  end
end
