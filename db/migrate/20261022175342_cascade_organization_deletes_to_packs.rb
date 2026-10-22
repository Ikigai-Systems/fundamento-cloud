# The packs feature was removed, but its tables stay until a follow-up drops them. With the
# models gone nothing deletes their rows, so purging an organization that has any would fail
# on these foreign keys. Cascading lets the database do it until the tables are dropped.
class CascadeOrganizationDeletesToPacks < ActiveRecord::Migration[8.1]
  def change
    remove_foreign_key :pack_versions, :organizations
    add_foreign_key :pack_versions, :organizations, on_delete: :cascade

    remove_foreign_key :packs, :organizations
    add_foreign_key :packs, :organizations, on_delete: :cascade
  end
end
