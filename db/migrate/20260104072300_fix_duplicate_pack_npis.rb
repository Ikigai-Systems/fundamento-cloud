class FixDuplicatePackNpis < ActiveRecord::Migration[8.1]
  def up
    # Find all duplicate NPIs in packs
    duplicates = execute(<<-SQL).to_a
      SELECT npi, COUNT(*) as count
      FROM packs
      GROUP BY npi
      HAVING COUNT(*) > 1
    SQL

    duplicates.each do |dup|
      npi = dup['npi']

      # Find all packs with this NPI
      packs_with_npi = execute(<<-SQL).to_a
        SELECT id, organization_id FROM packs WHERE npi = '#{npi}' ORDER BY id
      SQL

      # Skip the first one (keep it as is), regenerate NPIs for the rest
      packs_with_npi.drop(1).each do |pack|
        pack_id = pack['id']
        org_id = pack['organization_id']

        # Generate unique NPI using pack_id, org_id, and timestamp
        new_npi = nil
        loop do
          new_npi = Digest::MD5.hexdigest("pack_#{pack_id}_org_#{org_id}_#{Time.now.to_f}")[0..9]

          # Check if this NPI already exists
          result = execute("SELECT COUNT(*) as count FROM packs WHERE npi = '#{new_npi}'").first
          break if result['count'].to_i == 0
        end

        # Update the pack with the new unique NPI
        execute("UPDATE packs SET npi = '#{new_npi}' WHERE id = #{pack_id}")
      end
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Cannot reverse NPI uniqueness fixes"
  end
end
