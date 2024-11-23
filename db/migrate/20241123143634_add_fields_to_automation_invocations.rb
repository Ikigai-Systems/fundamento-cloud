class AddFieldsToAutomationInvocations < ActiveRecord::Migration[7.1]
  def change
    add_column :automation_invocations, :webhook, :string
    add_column :automation_invocations, :invoked_at, :datetime
  end
end
