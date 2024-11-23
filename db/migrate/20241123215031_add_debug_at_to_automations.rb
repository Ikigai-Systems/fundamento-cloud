class AddDebugAtToAutomations < ActiveRecord::Migration[7.1]
  def change
    add_column :automations, :debug_at, :datetime
  end
end
