# A record that an archive exists, so "when was this tenant last exported?" is a question
# the database answers rather than one somebody answers by looking in a bucket.
#
# Failures are rows too. An export that died is the case you most want to see, and a table
# that only holds successes reports perfect health right up until you need a restore.
class CreateTenantExports < ActiveRecord::Migration[8.1]
  def change
    create_table :tenant_exports, id: :string do |t|
      t.references :organization, null: false, type: :string, foreign_key: true
      t.string :status, null: false, default: "pending"
      t.integer :format_version, null: false
      t.string :digest
      t.bigint :byte_size
      t.jsonb :row_counts, null: false, default: {}
      t.text :error
      t.datetime :started_at
      t.datetime :finished_at
      t.timestamps
    end

    add_index :tenant_exports, [:organization_id, :created_at]
  end
end
