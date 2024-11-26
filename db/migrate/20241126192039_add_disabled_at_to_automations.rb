class AddDisabledAtToAutomations < ActiveRecord::Migration[7.1]
  def change
    add_column :automations, :disabled_at, :datetime
  end
end
