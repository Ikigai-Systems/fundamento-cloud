# db/seeds/setup/tables.rb
# Helpers for creating tables from YAML schema definitions + CSV data files.
# YAML defines column names and types, CSV provides row data.

section :table_helpers do
  # Create a table from a YAML definition file + CSV data file.
  #
  # YAML format:
  #   name: "Campaign Tracker"
  #   columns:
  #     - name: "Campaign"
  #       kind: string
  #     - name: "Budget"
  #       kind: decimal
  #   data: campaign-tracker.csv
  def tables.create_from_definition(label = nil, definition_path:, space:, organization:, **attrs)
    defn = YAML.load_file(definition_path, permitted_classes: [Symbol])
    csv_path = File.join(File.dirname(definition_path), defn["data"])

    table = create(label,
      name: defn["name"],
      space: space,
      organization: organization,
      parent: space,
      **attrs
    )

    # Create columns as linked list with proper kinds
    prev_col = nil
    defn["columns"].each do |col_def|
      col = context.tables_columns.create(
        table: table,
        name: col_def["name"],
        kind: col_def["kind"] || "string",
        previous_column: prev_col,
        organization: organization
      )
      prev_col = col
    end

    # Import rows from CSV, mapping values to columns by header name
    columns_by_name = table.columns.index_by(&:name)
    people_columns = table.columns.select { |c| c.kind.in?(%w[people multi_people]) }
    users_by_email = if people_columns.any?
      User.where(email: CSV.read(csv_path, headers: true).flat_map { |row|
        people_columns.map { |c| row[c.name] }
      }.compact.uniq).index_by(&:email)
    else
      {}
    end
    prev_row = nil

    CSV.foreach(csv_path, headers: true) do |csv_row|
      row = context.tables_rows.create(
        table: table,
        previous_row: prev_row,
        organization: organization
      )

      csv_row.each do |header, value|
        col = columns_by_name[header]
        next unless col

        # Resolve people column emails to user IDs
        if col.kind.in?(%w[people multi_people]) && value.present?
          value = if col.kind == "multi_people"
            value.split(",").map(&:strip).filter_map { |v| users_by_email[v]&.id&.to_s }.join(",")
          else
            users_by_email[value]&.id&.to_s
          end
        end

        context.tables_cells.create(
          table: table,
          column: col,
          row: row,
          value: value,
          organization: organization
        )
      end

      prev_row = row
    end

    puts "  [Table] #{defn["name"]} (#{table.rows.count} rows)"
    table
  end
end
