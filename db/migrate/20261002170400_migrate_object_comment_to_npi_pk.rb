# Swaps object_comments onto its string primary key, and rewrites the three places that hold
# a comment id. None of them is a foreign key, so none of them is visible in db/schema.rb and
# nothing would have failed loudly had one been missed.
#
# The reason this table gets a primary key swap rather than a per-object counter -- which would
# have been cheaper, and is what table_change_events got -- is object_references.source_comment_id:
# an integer reference with no constraint behind it. Tenant::IdMap has to rewrite it on every
# restore, and .claude/rules/tenant-archive.md singles out that class of column as the dangerous
# one, because an unmapped value attaches a mention to whatever row now holds that number,
# possibly in another tenant. A string key removes the column from IdMap entirely; a counter
# would have left it standing.
class MigrateObjectCommentToNpiPk < ActiveRecord::Migration[8.1]
  def up
    # 1. object_references.source_comment_id -- integer, no foreign key, partial index.
    #    Postgres rebuilds the index as part of the type change.
    change_column :object_references, :source_comment_id, :string

    execute <<~SQL
      UPDATE object_references
      SET source_comment_id = object_comments.npi
      FROM object_comments
      WHERE object_references.source_comment_id = object_comments.id::text
    SQL

    # 2. object_reactions.object_id -- polymorphic, already a string holding the integer as
    #    text. ObjectReaction::ALLOWED_OBJECT_TYPES includes ObjectComment, so comments carry
    #    reactions; nothing in the schema says so. The unique index on
    #    (emoji, object_id, object_type, organization_membership_id) survives because the
    #    rewrite is one-to-one.
    execute <<~SQL
      UPDATE object_reactions
      SET object_id = object_comments.npi
      FROM object_comments
      WHERE object_reactions.object_type = 'ObjectComment'
        AND object_reactions.object_id = object_comments.id::text
    SQL

    # 3. The audit trail.
    execute <<~SQL
      UPDATE audits
      SET auditable_id = object_comments.npi
      FROM object_comments
      WHERE audits.auditable_type = 'ObjectComment'
        AND audits.auditable_id = object_comments.id::text
    SQL

    execute <<~SQL
      UPDATE audits
      SET associated_id = object_comments.npi
      FROM object_comments
      WHERE audits.associated_type = 'ObjectComment'
        AND audits.associated_id = object_comments.id::text
    SQL

    remove_index :object_comments, :npi
    remove_column :object_comments, :id
    rename_column :object_comments, :npi, :id
    execute "ALTER TABLE object_comments ADD PRIMARY KEY (id)"
  end

  def down
    raise ActiveRecord::IrreversibleMigration,
      "Cannot reverse the NPI primary key swap for object_comments. Restore from backup."
  end
end
