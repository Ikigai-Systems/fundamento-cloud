# Append-only log of every content and structure change to a table, written in the same
# transaction as the mutation itself. This is the durable record: versions are derived
# from it, and it is what makes "nothing is ever lost" true between two snapshots.
class CreateTableChangeEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :table_change_events do |t|
      t.belongs_to :table, null: false, foreign_key: true, type: :string, index: false
      t.belongs_to :organization, null: false, foreign_key: true, type: :string
      t.belongs_to :actor, null: true, foreign_key: { to_table: :users }, type: :string
      t.belongs_to :version, null: true, foreign_key: { to_table: :table_versions }, type: :string, index: false

      t.integer :kind, limit: 2, null: false
      t.string :source, null: false, default: "system"
      t.jsonb :payload, null: false, default: {}

      t.datetime :created_at, null: false
    end

    # Events are read in insertion order for a single table, and claimed by version.
    add_index :table_change_events, [:table_id, :id]
    add_index :table_change_events, [:table_id, :version_id]
    add_index :table_change_events, [:table_id, :created_at]
  end
end
