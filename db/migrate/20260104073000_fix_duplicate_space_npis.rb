class FixDuplicateSpaceNpis < ActiveRecord::Migration[8.1]
  def up
    # Find all duplicate NPIs in spaces
    duplicates = execute(<<-SQL).to_a
      SELECT npi, COUNT(*) as count
      FROM spaces
      GROUP BY npi
      HAVING COUNT(*) > 1
    SQL

    duplicates.each do |dup|
      npi = dup['npi']

      # Find all spaces with this NPI
      spaces_with_npi = execute(<<-SQL).to_a
        SELECT id, organization_id FROM spaces WHERE npi = '#{npi}' ORDER BY id
      SQL

      # Skip the first one (keep it as is), regenerate NPIs for the rest
      spaces_with_npi.drop(1).each do |space|
        space_id = space['id']
        org_id = space['organization_id']

        # Generate unique NPI using space_id, org_id, and timestamp
        new_npi = nil
        loop do
          new_npi = Digest::MD5.hexdigest("space_#{space_id}_org_#{org_id}_#{Time.now.to_f}")[0..9]

          # Check if this NPI already exists
          result = execute("SELECT COUNT(*) as count FROM spaces WHERE npi = '#{new_npi}'").first
          break if result['count'].to_i == 0
        end

        # Update the space with the new unique NPI
        execute("UPDATE spaces SET npi = '#{new_npi}' WHERE id = #{space_id}")
      end
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Cannot reverse NPI uniqueness fixes"
  end
end
