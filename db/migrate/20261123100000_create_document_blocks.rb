# The blocks each document has had, with the latest saved version that still had each one.
# Comments on blocks read it to find the blocks that are gone, instead of parsing versions.
class CreateDocumentBlocks < ActiveRecord::Migration[8.1]
  def change
    # The id comes from the database: the reconciler writes rows with upsert_all, which skips the
    # model callback that generates ids.
    create_table :document_blocks, id: {type: :string, default: -> { "gen_random_uuid()" }} do |t|
      t.string :document_id, null: false
      t.string :block_id, null: false
      t.bigint :last_version_id, null: false
      t.timestamps
    end

    add_index :document_blocks, [:document_id, :block_id], unique: true
    add_index :document_blocks, :last_version_id
    add_foreign_key :document_blocks, :documents, on_delete: :cascade
    add_foreign_key :document_blocks, :versions, column: :last_version_id, on_delete: :cascade
  end
end
