# Materialized snapshots of a table, one per coalesced burst of edits. The snapshot
# payload itself is an ActiveStorage attachment (gzipped JSON) so a 50k-row table does
# not land in Postgres; everything here is metadata the history list can render without
# touching the blob.
class CreateTableVersions < ActiveRecord::Migration[8.1]
  def change
    create_table :table_versions, id: :string, default: -> { "gen_random_uuid()" } do |t|
      t.belongs_to :table, null: false, foreign_key: true, type: :string
      t.belongs_to :organization, null: false, foreign_key: true, type: :string
      t.belongs_to :created_by, null: true, foreign_key: { to_table: :users }, type: :string
      t.belongs_to :restored_from, null: true, foreign_key: { to_table: :table_versions }, type: :string

      t.integer :sequential_id, null: false
      t.integer :kind, limit: 2, null: false, default: 0

      t.jsonb :summary, null: false, default: {}
      t.integer :row_count
      t.integer :column_count
      t.string :content_digest
      t.boolean :pinned, null: false, default: false

      t.timestamps
    end

    add_index :table_versions, [:table_id, :sequential_id], unique: true
  end
end
