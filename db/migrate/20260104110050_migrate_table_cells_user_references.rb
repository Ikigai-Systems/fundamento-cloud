class MigrateTableCellsUserReferences < ActiveRecord::Migration[8.1]
  def up
    # Find all columns with kind 'people' (11) or 'multi_people' (14)
    # These columns store user IDs in table_cells.value

    # For 'people' columns: single user ID
    # Update cells to use NPIs instead of numeric IDs
    execute <<-SQL
      UPDATE table_cells
      SET value = users.npi
      FROM users, table_columns
      WHERE table_cells.column_id = table_columns.id
        AND table_columns.kind = 11
        AND table_cells.value IS NOT NULL
        AND table_cells.value != ''
        AND table_cells.value = users.id::text
    SQL

    # For 'multi_people' columns: comma-separated user IDs
    # We need to handle this differently since it's comma-separated
    # We'll process each cell individually

    # Get all multi_people column IDs
    multi_people_column_ids = execute(<<-SQL).to_a.map { |row| row["id"] }
      SELECT id FROM table_columns WHERE kind = 14
    SQL

    multi_people_column_ids.each do |column_id|
      # Get all cells for this column that have values
      cells = execute(<<-SQL).to_a
        SELECT row_id, value
        FROM table_cells
        WHERE column_id = '#{column_id}'
          AND value IS NOT NULL
          AND value != ''
      SQL

      cells.each do |cell|
        row_id = cell["row_id"]
        old_value = cell["value"]

        # Split by comma, convert each ID to NPI, rejoin
        user_ids = old_value.split(",").map(&:strip)

        # Build mapping query for all IDs at once
        next if user_ids.empty?

        # Get NPIs for all user IDs in this cell
        npi_mapping = execute(<<-SQL).to_a
          SELECT id::text as old_id, npi
          FROM users
          WHERE id::text IN (#{user_ids.map { |id| "'#{id}'" }.join(',')})
        SQL

        # Create a hash for quick lookup
        id_to_npi = npi_mapping.each_with_object({}) do |row, hash|
          hash[row["old_id"]] = row["npi"]
        end

        # Convert each user ID to NPI, keeping IDs that don't have a mapping
        new_user_ids = user_ids.map { |id| id_to_npi[id] || id }
        new_value = new_user_ids.join(",")

        # Update the cell
        execute(<<-SQL)
          UPDATE table_cells
          SET value = '#{new_value}'
          WHERE column_id = '#{column_id}' AND row_id = '#{row_id}'
        SQL
      end
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Cannot reverse user ID to NPI conversion in table cells"
  end
end
