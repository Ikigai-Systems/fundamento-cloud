# Seeds (Oaken)

## Table seed helper

`tables.create_from_definition` creates a table from a YAML schema + CSV data file.

- **People columns** (`people`/`multi_people`): Store user emails in the CSV. The helper auto-resolves them to user IDs — no mapping hashes needed.
- **Documents columns**: Cannot be populated from CSV because tables are created before documents (documents reference table NPIs via `table_placeholders`). Use a backfill step after documents exist:
  ```ruby
  col = table.columns.find_by!(name: "Column Name")
  rows_by_key = table.rows.index_by { |r|
    r.cells.find_by(column: table.columns.find_by!(name: "Key Column"))&.value
  }
  { "Row Value" => [doc1, doc2] }.each do |key, docs|
    row = rows_by_key[key] or next
    cell = row.cells.find_or_initialize_by(column: col)
    cell.update!(table: table, value: docs.map(&:npi).join(","), organization: org)
  end
  ```

## Adding a new seed scenario

See the Development Seeds section in CLAUDE.md. Key steps:
1. Create directory under `db/seeds/organizations/`
2. Add org name to `SEED_ORG_NAMES` and email domain to `SEED_EMAIL_DOMAINS` in `db/seeds.rb`
3. Build blocknote-converter before running seeds
