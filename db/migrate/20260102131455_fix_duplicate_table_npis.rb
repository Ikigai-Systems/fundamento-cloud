class FixDuplicateTableNpis < ActiveRecord::Migration[8.1]
  def up
    # These NPIs were used in onboarding materials and are duplicated across organizations
    duplicate_npis = ['7enpoTncq9', '7hDhcL1cyv', 'u34fOBpaFp']

    duplicate_npis.each do |npi|
      # Find all tables with this NPI
      tables_with_npi = execute(<<-SQL).to_a
        SELECT id, organization_id FROM tables WHERE npi = '#{npi}' ORDER BY id
      SQL

      # Skip the first one (keep it as is), regenerate NPIs for the rest
      tables_with_npi.drop(1).each do |row|
        table_id = row['id']
        org_id = row['organization_id']

        # Generate unique NPI using table_id, org_id, and timestamp for uniqueness
        new_npi = nil
        loop do
          new_npi = Digest::MD5.hexdigest("table_#{table_id}_org_#{org_id}_#{Time.now.to_f}")[0..9]

          # Check if this NPI already exists
          result = execute("SELECT COUNT(*) as count FROM tables WHERE npi = '#{new_npi}'").first
          break if result['count'].to_i == 0
        end

        # Update the table with the new unique NPI
        execute("UPDATE tables SET npi = '#{new_npi}' WHERE id = #{table_id}")
      end
    end

    # Also fix any other duplicates that might exist
    duplicates = execute(<<-SQL).to_a
      SELECT npi, COUNT(*) as count
      FROM tables
      GROUP BY npi
      HAVING COUNT(*) > 1
    SQL

    duplicates.each do |dup|
      npi = dup['npi']

      # Skip if we already handled this NPI above
      next if duplicate_npis.include?(npi)

      # Find all tables with this NPI
      tables_with_npi = execute(<<-SQL).to_a
        SELECT id, organization_id FROM tables WHERE npi = '#{npi}' ORDER BY id
      SQL

      # Skip the first one, regenerate for the rest
      tables_with_npi.drop(1).each do |row|
        table_id = row['id']
        org_id = row['organization_id']

        new_npi = nil
        loop do
          new_npi = Digest::MD5.hexdigest("table_#{table_id}_org_#{org_id}_#{Time.now.to_f}")[0..9]
          result = execute("SELECT COUNT(*) as count FROM tables WHERE npi = '#{new_npi}'").first
          break if result['count'].to_i == 0
        end

        execute("UPDATE tables SET npi = '#{new_npi}' WHERE id = #{table_id}")
      end
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Cannot reverse NPI uniqueness fixes"
  end
end
