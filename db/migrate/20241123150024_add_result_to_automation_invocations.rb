class AddResultToAutomationInvocations < ActiveRecord::Migration[7.1]
  def change
    add_column :automation_invocations, :result, :string
  end
end
