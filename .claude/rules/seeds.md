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

## Mentions in seed content

Mentions are what populate `object_references`, which is the only source for the
notifications badge and the connections sidebar — so seed content without them
leaves both features untestable by hand.

**In markdown**, any entity works through the same span; the converter is
entity-agnostic:

```html
<span data-mention="user" data-entity-id="sarah@brightpath.example.com">Sarah</span>
<span data-mention="document" data-entity-id="PLACEHOLDER_doc_vacation_policy">Vacation Policy</span>
```

User mentions carry an email, resolved by `resolve_user_mentions!` at any point.
Document and table mentions carry a `PLACEHOLDER_*` token, resolved from the
`document_placeholders:` / `table_placeholders:` hashes passed to
`create_from_markdown`. **The referenced document must already exist**, so a
mention can only point backwards in the scenario's creation order. A forward
reference needs a backfill pass after every document exists — and unlike the table
cell backfill above, that means rewriting both `content_blocks` and the YJS
`content`, so prefer reordering creation where the narrative allows.

**In comments**, build the node directly — `comment_content` takes plain strings
and mention nodes interchangeably:

```ruby
content: comment_content("Good call, ", user_mention(priya), ". I've updated the split.")
```

Comments are created after every document, so document mentions there have no
ordering constraint. Note the reference's source is the object the comment is *on*,
not the mentioned document.

## Adding a new seed scenario

See the Development Seeds section in CLAUDE.md. Key steps:
1. Create directory under `db/seeds/organizations/`
2. Add org name to `SEED_ORG_NAMES` and email domain to `SEED_EMAIL_DOMAINS` in `db/seeds.rb`
3. Build blocknote-converter before running seeds
