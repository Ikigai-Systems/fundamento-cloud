# Release 2 of removing automations.run_as_id: release 1 (the previous deploy) stopped reading
# and writing it. Webhooks run as the caller, recorded on automation_invocations.run_as_id.
class RemoveRunAsFromAutomations < ActiveRecord::Migration[8.1]
  def change
    remove_reference :automations, :run_as, type: :string, index: true,
      foreign_key: { to_table: :organization_memberships, on_delete: :nullify }
  end
end
