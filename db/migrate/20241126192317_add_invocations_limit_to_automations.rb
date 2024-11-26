class AddInvocationsLimitToAutomations < ActiveRecord::Migration[7.1]
  def change
    add_column :automations, :invocations_limit, :integer, limit: 2
  end
end
