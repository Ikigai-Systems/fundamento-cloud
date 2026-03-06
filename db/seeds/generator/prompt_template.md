# Fundamento Seed Scenario Generator

You are generating a complete seed scenario for Fundamento, a collaborative workspace platform similar to Notion/Airtable.

## Output Structure

Generate these files in the output directory:

```
README.md                          # Scenario narrative documentation
seed.rb                            # Main Oaken seed script
content/
  documents/
    *.md                           # Markdown documents (one per document)
  tables/
    *.yml                          # Table schema definitions
    *.csv                          # Table row data
```

## Conventions

### README.md

Document the scenario with these sections:
- Context (1-2 sentences about the organization)
- People (table: Name, Email, Role, Persona)
- Spaces (table: Space, Access, Purpose)
- Documents (grouped by space)
- Tables (table: Table, Space, Key Columns, ~Rows)
- Timeline (bullet list of key events from founding to today)
- Key Interactions (comments and reactions to create)

Email addresses must use `@<orgname>.example.com` domain.
Roles are either `Manager` (org admin) or `Member`.

### seed.rb

Uses the Oaken DSL with these available helpers:

- `timeline` - returns a SeedTimeline instance with anchors: `company_founded`, `first_week`, `onboarding_done`, `ramp_up`, `steady_state`, `recent`, `today`
- `timeline.around(time, spread: 2.hours)` - add jitter to timestamps
- `organizations.create_seed(label, **attrs)` - create org without default space callback
- `spaces.create_seed(label, **attrs)` - create space without home document callback
- `users.create(label, **attrs)` - create user with auto-confirm and unique_by: :email
- `tables.create_from_definition(label, definition_path:, space:, organization:, **attrs)` - create table from YAML+CSV
- `documents.create_from_markdown(label, markdown_path:, space:, organization:, author:, table_placeholders: {}, **attrs)` - create document from markdown
- `object_comments.create(**attrs)` - needs organization, organization_membership, object, content (JSON blocks)
- `object_reactions.create(**attrs)` - needs organization, organization_membership, object, emoji

Comment content format: `[{ "type" => "paragraph", "content" => [{ "type" => "text", "text" => "..." }] }]`

Use `scenario_dir = Pathname.new(__dir__)` to reference content paths.
Create tables BEFORE documents (so NPIs can be referenced in markdown placeholders).

### Table Definitions (YAML + CSV)

YAML format:
```yaml
name: "Table Name"
columns:
  - name: "Column Name"
    kind: string|number|decimal|date|datetime|select|checkbox|url|long_text
data: filename.csv
```

CSV headers must exactly match YAML column names.

### Markdown Documents

- Standard markdown with headings, lists, bold, links, code blocks
- To embed a table: `<div data-content-type="advancedTable" data-table-npi="PLACEHOLDER_<table_label>">Table</div>`
- To embed a chart: `<div data-content-type="chartBlock" data-table-npi="PLACEHOLDER_<table_label>" data-title="Title" data-chart-type="bar|line|pie" data-x-axis-column-npi="PLACEHOLDER_<column_name_snake>" data-y-axis-column-npi="PLACEHOLDER_<column_name_snake>">Chart</div>`
- Column placeholder names are derived from column names: lowercase, spaces replaced with underscores
- 100-400 words per document
- No emojis in document content

### Timestamps

All timestamps should use the timeline anchors:
- `t.company_founded` (~3 months ago)
- `t.first_week` (~3 months ago + 1 week)
- `t.onboarding_done` (~2.5 months ago)
- `t.ramp_up` (~2 months ago)
- `t.steady_state` (~1 month ago)
- `t.recent` (~1 week ago)
- `t.today` (now)

Wrap in `t.around(time)` for realistic jitter.

## Quality Guidelines

- Content should feel like a real team working, not placeholder text
- Include a mix of polished docs (policies) and rough docs (brainstorms, drafts)
- Tables should have varied data with realistic values
- Include 5-8 comments and 2-4 reactions for a lived-in feel
- At least one document should embed a table, and one should embed a chart
- Have 4-8 team members with distinct personas
- Create 2-4 spaces with different access modes (public, restricted, private)
- Create 10-20 documents and 3-6 tables
