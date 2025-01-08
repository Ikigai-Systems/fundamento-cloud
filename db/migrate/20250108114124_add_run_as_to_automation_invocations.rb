class AddRunAsToAutomationInvocations < ActiveRecord::Migration[7.1]
  def change
    add_belongs_to :automation_invocations, :run_as,  foreign_key: { to_table: :organization_users }
  end
end
