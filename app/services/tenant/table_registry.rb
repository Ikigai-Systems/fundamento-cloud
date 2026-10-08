# What a per-tenant export contains, and how each table is reached.
#
# Every table in the schema must appear here exactly once. A spec enforces that, because
# the failure mode otherwise is silent: a table nobody classified is simply absent from
# every export, and the moment you find out is a restore.
#
# Adding a table means deciding which of these it is. That decision is cheap when you are
# already writing the migration and expensive at three in the morning.
module Tenant
  class TableRegistry
    # Not tenant data. Never exported, and restoring one would be actively wrong.
    #
    # `tenant_exports` carries organization_id and is still not tenant data: it is the
    # record of previous archives. Including it would put a tenant's backup history, and
    # by way of Active Storage its previous archives, inside its next one.
    #
    # `audits` is here despite being application data: it has no organization_id, it is
    # never pruned, and it cannot reconstruct document or table content anyway because
    # ObjectContent and Tables::Cell/Row/Column all skip_auditing. Exporting it would cost
    # more than the whole rest of the archive and buy nothing.
    GLOBAL = %w[
      ar_internal_metadata
      audits
      flipper_features
      flipper_gates
      good_job_batches
      good_job_executions
      good_job_processes
      good_job_settings
      good_jobs
      oauth_applications
      schema_migrations
      superintendents
      tenant_exports
      user_identities
    ].freeze

    # A tenant's own rows that an archive deliberately leaves out. Distinct from GLOBAL, which
    # is about rows that are nobody's tenant data; these belong to a tenant and are excluded on
    # purpose, which is a claim that needs a reason next to it.
    EXCLUDED = {
      # The staging area for an import, not its result. The documents an import produced are
      # exported in their own right, and so are the attachments it created -- by design the
      # import file and the resulting Attachment *share* one Active Storage blob
      # (ImportDocumentJob#attach_source_file), so nothing in the archive depends on these rows.
      #
      # Leaving them in was also incoherent: the exporter never scoped
      # record_type = 'ImportFile' in active_storage_attachments, so it archived import_files
      # rows without the blobs they point at, and a restore would put back a record referring
      # to a file the archive never held.
      #
      # import_sessions.path_map additionally maps source paths to the document ids the import
      # created, which is one more place embedded ids would have to be rewritten.
      "import_sessions" => "the staging area for an import, not its result",
      "import_files" => "the staging area for an import, not its result",
    }.freeze

    # The tenant itself.
    ROOT = "organizations".freeze

    # Carry organization_id, so a single WHERE selects the tenant's rows.
    DIRECT = %w[
      api_tokens
      attachments
      automation_invocations
      automations
      documents
      invited_users
      object_comments
      object_reactions
      object_references
      object_tags
      organization_memberships
      pack_versions
      packs
      public_links
      space_memberships
      spaces
      table_cells
      table_change_events
      table_columns
      table_rows
      table_versions
      tables
      tags
      team_memberships
      teams
    ].freeze

    # No organization_id: reached through a parent that has one. The value is the column
    # on this table and the table it points at, which is what the exporter turns into a
    # subquery rather than a join, so each table is still read in one pass.
    DERIVED = {
      "document_editing_sessions" => { foreign_key: "document_id", parent: "documents" },
      "favorites" => { foreign_key: "organization_membership_id", parent: "organization_memberships" },
      "inline_comment_threads" => { foreign_key: "document_id", parent: "documents" },
      "inline_comments" => { foreign_key: "inline_comment_thread_id", parent: "inline_comment_threads" },
      "oauth_access_grants" => { foreign_key: "organization_membership_id", parent: "organization_memberships" },
      "oauth_access_tokens" => { foreign_key: "organization_membership_id", parent: "organization_memberships" },
      "object_contents" => { foreign_key: "owner_id", parent: "documents", polymorphic_type: "Document" },
      "organization_membership_properties" => { foreign_key: "organization_membership_id", parent: "organization_memberships" },
      "versions" => { foreign_key: "document_id", parent: "documents" },
    }.freeze

    # Derived rules whose column carries no foreign key, so the schema cannot confirm the
    # parent and a spec cannot check it. Each one here has been verified against production
    # data instead, and adding to this list is meant to be uncomfortable.
    #
    # This list exists because getting one wrong is silent. `resource_owner_id` looks like
    # the tenant link on the oauth tables and is not -- it points at users, so an export
    # built on it would have contained zero tokens and said nothing. The real link is
    # organization_membership_id, populated on all 384 production rows.
    UNCONSTRAINED = %w[
      oauth_access_grants
      oauth_access_tokens
      object_contents
    ].freeze

    # Polymorphic across several exported parents, so they cannot be expressed as a single
    # derived rule. The exporter collects the ids of everything else it exported first.
    POLYMORPHIC = %w[
      active_storage_attachments
      active_storage_blobs
      active_storage_variant_records
      object_visitors
    ].freeze

    # Exported as a redacted projection -- id, email, name -- and never as rows.
    #
    # A user belongs to many organizations. Restoring user rows could resurrect someone
    # who was removed from a different organization entirely, and would carry their
    # credentials with it. Seven foreign keys point at users, so a restore into another
    # database matches on email and creates a stub where it finds nobody.
    PROJECTED = %w[
      users
    ].freeze

    def self.all_declared
      (GLOBAL + EXCLUDED.keys + [ROOT] + DIRECT + DERIVED.keys + POLYMORPHIC + PROJECTED).sort
    end

    # Everything that actually ends up in an archive, in no particular order -- the
    # exporter decides ordering, this decides membership.
    def self.exported
      ([ROOT] + DIRECT + DERIVED.keys + POLYMORPHIC + PROJECTED).sort
    end
  end
end
