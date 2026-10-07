# The order rows go back in, and the references that cannot be satisfied by ordering alone.
#
# Seventy-six foreign keys connect the exported tables. An order that violates one does not
# produce a subtly wrong restore, it produces a failed one partway through -- so this is
# written down once and checked against the database's own constraints by a spec, rather
# than against anybody's recollection of them.
#
# Two kinds of reference cannot be fixed by sorting tables:
#
#   DEFERRED       a cycle. spaces points at documents and documents point back at spaces,
#                  so one of them goes in with the column NULL and a second pass fills it.
#
#   CHAIN_ORDERED  a table pointing at itself. No table order helps; the rows have to be
#                  inserted along the chain so each row's predecessor already exists.
module Tenant
  class RestoreOrder
    # Parents before children. Derived from the foreign key graph and enforced by
    # spec/services/tenant/restore_order_spec.rb -- if you add a table, the spec will tell
    # you where it does not belong.
    TABLES = %w[
      organizations
      users
      organization_memberships
      organization_membership_properties
      teams
      team_memberships
      spaces
      documents
      space_memberships
      tables
      table_columns
      table_rows
      table_cells
      table_versions
      table_change_events
      tags
      object_tags
      object_contents
      versions
      document_editing_sessions
      inline_comment_threads
      inline_comments
      object_comments
      object_reactions
      object_visitors
      favorites
      object_references
      public_links
      api_tokens
      invited_users
      packs
      pack_versions
      automations
      automation_invocations
      import_sessions
      import_files
      attachments
      active_storage_blobs
      active_storage_attachments
      active_storage_variant_records
      oauth_access_grants
      oauth_access_tokens
    ].freeze

    # Written NULL on the way in, filled by a second pass once the target exists.
    #
    # spaces.home_document_id and documents.space_id are a genuine cycle: a space needs its
    # home document and the document needs its space. packs.active_version_id and
    # pack_versions.pack_id are the same shape.
    DEFERRED = [
      ["spaces", "home_document_id"],
      ["packs", "active_version_id"],
    ].freeze

    # Columns pointing at their own table. These decide the order rows go in, not the order
    # tables do -- see Tables::RestoreService#insert_columns, which batches along the chain
    # so every previous_column_id already names a row written in this statement or an
    # earlier one.
    CHAIN_ORDERED = [
      ["table_columns", "previous_column_id"],
      ["table_rows", "previous_row_id"],
      ["table_versions", "restored_from_id"],
    ].freeze

    def self.deferred?(table, column)
      DEFERRED.include?([table, column])
    end

    def self.chain_ordered?(table, column)
      CHAIN_ORDERED.include?([table, column])
    end
  end
end
