# automations.run_as_id is no longer used and goes in a follow-up. Until then it would still
# stop a member who once created an automation from being removed. Nullify rather than
# cascade: removing a member must not delete the automations they created.
class NullifyAutomationRunAsOnMemberDelete < ActiveRecord::Migration[8.1]
  def change
    remove_foreign_key :automations, :organization_memberships, column: :run_as_id
    add_foreign_key :automations, :organization_memberships, column: :run_as_id, on_delete: :nullify
  end
end
