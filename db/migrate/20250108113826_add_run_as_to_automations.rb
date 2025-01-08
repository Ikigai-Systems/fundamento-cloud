class AddRunAsToAutomations < ActiveRecord::Migration[7.1]
  def change
    add_belongs_to :automations, :run_as,  foreign_key: { to_table: :organization_users }
  end
end
