class CreateAutomationInvocations < ActiveRecord::Migration[7.1]
  def change
    create_table :automation_invocations do |t|
      t.belongs_to :organization, foreign_key: true
      t.belongs_to :space, foreign_key: true
      t.belongs_to :automation, foreign_key: true

      t.integer :kind, null: false, limit: 2
      t.string :formula, null: true

      t.timestamps
    end
  end
end
