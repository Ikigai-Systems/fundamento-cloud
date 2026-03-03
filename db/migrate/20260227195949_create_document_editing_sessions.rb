class CreateDocumentEditingSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :document_editing_sessions, id: :string do |t|
      t.references :document, null: false, foreign_key: true, type: :string
      t.references :member, null: false, foreign_key: { to_table: :organization_memberships }, type: :string
      t.references :version, null: true, foreign_key: true

      t.datetime :connected_at, null: false
      t.datetime :disconnected_at
      t.boolean :edited, default: false, null: false

      t.timestamps
    end

    add_index :document_editing_sessions, [:document_id, :version_id]
    add_index :document_editing_sessions, [:document_id, :member_id]
  end
end
