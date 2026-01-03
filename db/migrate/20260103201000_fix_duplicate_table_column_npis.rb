class FixDuplicateTableColumnNpis < ActiveRecord::Migration[8.1]
  def up
    # Find all duplicate NPIs in table_columns
    duplicates = execute(<<-SQL).to_a
      SELECT npi, COUNT(*) as count
      FROM table_columns
      GROUP BY npi
      HAVING COUNT(*) > 1
    SQL

    duplicates.each do |dup|
      npi = dup['npi']

      # Find all columns with this NPI
      columns_with_npi = execute(<<-SQL).to_a
        SELECT id, table_id, organization_id FROM table_columns WHERE npi = '#{npi}' ORDER BY id
      SQL

      # Skip the first one (keep it as is), regenerate NPIs for the rest
      columns_with_npi.drop(1).each do |row|
        column_id = row['id']
        table_id = row['table_id']
        org_id = row['organization_id']

        # Generate unique NPI using column_id, table_id, org_id, and timestamp
        new_npi = nil
        loop do
          new_npi = Digest::MD5.hexdigest("column_#{column_id}_table_#{table_id}_org_#{org_id}_#{Time.now.to_f}")[0..9]

          # Check if this NPI already exists
          result = execute("SELECT COUNT(*) as count FROM table_columns WHERE npi = '#{new_npi}'").first
          break if result['count'].to_i == 0
        end

        # Update the column with the new unique NPI
        execute("UPDATE table_columns SET npi = '#{new_npi}' WHERE id = #{column_id}")
      end
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Cannot reverse NPI uniqueness fixes"
  end
end
