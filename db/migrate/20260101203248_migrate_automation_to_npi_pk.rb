class MigrateAutomationToNpiPk < ActiveRecord::Migration[8.1]
  def up
    # Step 1: Drop foreign key from automation_invocations to automations
    if foreign_key_exists?(:automation_invocations, :automations)
      remove_foreign_key :automation_invocations, :automations
    end

    # Step 2: Update automation_invocations.automation_id to string type (no limit to match PK)
    change_column :automation_invocations, :automation_id, :string

    # Step 3: Copy NPI values to automation_invocations.automation_id
    execute <<-SQL
      UPDATE automation_invocations
      SET automation_id = automations.npi
      FROM automations
      WHERE automation_invocations.automation_id::text = automations.id::text
    SQL

    # Step 4: Drop the old id column from automations (drops PK constraint automatically)
    remove_column :automations, :id

    # Step 5: Rename npi column to id
    rename_column :automations, :npi, :id

    # Step 6: Add primary key constraint on id
    execute "ALTER TABLE automations ADD PRIMARY KEY (id)"

    # Step 7: Re-add foreign key
    add_foreign_key :automation_invocations, :automations, column: :automation_id
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Cannot reverse Automation to NPI primary key migration. Restore from backup if needed."
  end
end
