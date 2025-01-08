class MakeRunAsNonNullOnAutomationInvocations < ActiveRecord::Migration[7.1]
  def change
    change_column_null :automation_invocations, :run_as_id, false
  end
end
