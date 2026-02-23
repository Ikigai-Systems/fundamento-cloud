# Development Seed System Design

## Problem

Manual database seeding doesn't scale. It's hard to collaborate on, produces stale data, and can't serve double duty for marketing screenshots/videos. We need a robust, maintainable seeding system that produces realistic content with relative timestamps.

## Goals

- Realistic, "lived-in" workspaces suitable for demos and marketing materials
- Easy to maintain: content authored as markdown and CSV, not raw JSON
- Easy to extend: add new organization scenarios without modifying existing code
- Relative timestamps: seeded data always looks fresh regardless of when it's imported
- Reusable tooling: AI-assisted scripts to bootstrap new scenarios quickly
- Future test integration: seed data shareable with the test suite via Oaken

## Approach: Oaken + Content Pipeline

Use the [Oaken gem](https://github.com/kaspth/oaken) for the seed DSL and test integration foundation. Oaken provides named record references, scenario-based organization, and the ability to share seed data between development and test environments.

Fallback: if Oaken doesn't integrate well with our model conventions (string NPIs, complex callbacks), fall back to plain Ruby service classes with the same directory structure and content pipeline.

## Architecture

### Directory Structure

```
db/seeds.rb                                    # Entry point
db/seeds/
  setup.rb                                     # Oaken defaults, model registrations
  setup/
    documents.rb                               # Markdown->BlockNote->YJS helpers
    tables.rb                                  # YAML schema + CSV import helpers
    timeline.rb                                # Relative timestamp helpers
  organizations/
    marketing_agency/
      README.md                                # Scenario narrative for humans/AI
      seed.rb                                  # Main seed script
      content/
        documents/
          welcome-to-brightpath.md
          vacation-policy.md
          travel-reimbursement-policy.md
          out-of-office-guidelines.md
          new-hire-onboarding-checklist.md
          team-meeting-notes.md
          greenleaf-gtm-strategy.md
          greenleaf-q1-campaign-brief.md
          urbanfit-brand-voice-guide.md
          urbanfit-instagram-campaign.md
          technova-proposal-draft.md
          content-calendar-template.md
          campaign-brainstorm-spring.md
          design-system-guidelines.md
        tables/
          campaign-tracker.yml
          campaign-tracker.csv
          content-calendar.yml
          content-calendar.csv
          vacation-tracker.yml
          vacation-tracker.csv
          client-contacts.yml
          client-contacts.csv
          expense-reports.yml
          expense-reports.csv
bin/generate-seed                              # AI-assisted scenario generator
```

### Entry Point

```ruby
# db/seeds.rb
return unless Rails.env.development?

puts "Cleaning seed data..."
SEED_ORG_NAMES = ["BrightPath Media"]
Organization.where(name: SEED_ORG_NAMES).destroy_all
User.where("email LIKE '%@brightpath.example.com'").destroy_all

puts "Seeding..."
Oaken.seed :organizations
```

Clean-slate approach: destroys known seed organizations and their cascade, then recreates from scratch. Seed users use a `@<scenario>.example.com` email convention so they're identifiable. Manually-created dev accounts are unaffected.

### Oaken Setup

```ruby
# db/seeds/setup.rb
loader.defaults created_at: -> { Time.current }, updated_at: -> { Time.current }

section users do
  users.defaults password: "password"
  def users.create(label = nil, unique_by: :email, **) = super
end

section organizations do
  # Suppress auto-creation of default space + onboarding content
  def organizations.create_without_defaults(label = nil, **attrs)
    Organization.skip_callback(:create, :after, :create_default_space)
    result = create(label, **attrs)
    Organization.set_callback(:create, :after, :create_default_space)
    result
  end
end

section spaces do
  # Suppress auto-creation of home document + onboarding content
  def spaces.create_without_defaults(label = nil, **attrs)
    Space.skip_callback(:create, :after, :create_home_document!)
    result = create(label, **attrs)
    Space.set_callback(:create, :after, :create_home_document!)
    result
  end
end

# Register namespaced models that Oaken can't auto-resolve
loader.register Tables::Column, as: :tables_columns
loader.register Tables::Row, as: :tables_rows
loader.register Tables::Cell, as: :tables_cells
```

### Content Pipeline: Documents

Documents are authored as `.md` files. At seed time, they're converted via the existing BlocknoteConverterService (markdown -> BlockNote JSON -> YJS binary).

```ruby
# db/seeds/setup/documents.rb
def documents.create_from_markdown(label = nil, markdown_path:, space:, organization:, author: nil, table_placeholders: {}, **attrs)
  markdown = File.read(markdown_path)
  blocks = BlocknoteConverterService.markdown_to_blocks(markdown)

  # Resolve table/column NPI placeholders
  resolve_placeholders!(blocks, table_placeholders)

  yjs_binary = BlocknoteConverterService.blocks_to_yjs(blocks)

  title = attrs.delete(:title) || title_from_filename(markdown_path)

  doc = create(label,
    title: title,
    sync: yjs_binary,
    space: space,
    organization: organization,
    **attrs
  )

  context.versions.create(
    document: doc,
    content_blocks: blocks,
    created_by: author,
    sequential_id: 1
  )

  # Add to space hierarchy
  space.add_to_hierarchy!(doc)

  doc
end
```

Markdown files support Fundamento's custom blocks via raw HTML:

```markdown
# Campaign Performance

Here's our live tracker:

<div data-content-type="advancedTable" data-table-npi="PLACEHOLDER_campaign_tracker">Table</div>

Performance over time:

<div data-content-type="chartBlock" data-table-npi="PLACEHOLDER_campaign_tracker" data-title="Weekly Impressions" data-chart-type="bar" data-x-axis-column-npi="PLACEHOLDER_impressions_col" data-y-axis-column-npi="PLACEHOLDER_week_col">Chart</div>
```

Placeholders (`PLACEHOLDER_*`) are resolved at seed time by matching against the named Oaken table/column records and replacing with actual NPIs.

### Content Pipeline: Tables

Tables use a YAML schema file (column names, types) paired with a CSV data file (row values).

```yaml
# campaign-tracker.yml
name: "Campaign Tracker"
columns:
  - name: "Campaign"
    kind: string
  - name: "Client"
    kind: string
  - name: "Start Date"
    kind: date
  - name: "Budget"
    kind: decimal
  - name: "Status"
    kind: select
  - name: "Impressions"
    kind: number
data: campaign-tracker.csv
```

```ruby
# db/seeds/setup/tables.rb
def tables.create_from_definition(label = nil, definition_path:, space:, organization:, **attrs)
  defn = YAML.load_file(definition_path, permitted_classes: [Symbol])
  csv_path = definition_path.dirname.join(defn["data"])

  table = create(label,
    name: defn["name"],
    space: space, organization: organization,
    parent: space,
    **attrs
  )

  # Create columns as linked list with proper kinds
  prev_col = nil
  defn["columns"].each do |col_def|
    col = context.tables_columns.create(
      table: table, name: col_def["name"],
      kind: col_def["kind"], previous_column: prev_col,
      organization: organization
    )
    prev_col = col
  end

  # Import row data from CSV
  CSV.foreach(csv_path, headers: true) do |row|
    table.add_row(SecureRandom.hex(5), row.to_h.values)
  end

  table
end
```

Why YAML + CSV instead of just CSV: `import_from_csv` creates all columns as `string` type. The YAML schema lets us specify `date`, `number`, `decimal`, `select`, `formula` -- critical for realistic demos.

### Relative Timestamps

All dates anchor to `Time.current` via a Timeline helper. Named anchors tell the scenario's story:

```ruby
# db/seeds/setup/timeline.rb
class Timeline
  def initialize
    @base = Time.current
  end

  def company_founded  = @base - 3.months
  def first_week       = @base - 3.months + 1.week
  def onboarding_done  = @base - 2.months - 2.weeks
  def ramp_up          = @base - 2.months
  def steady_state     = @base - 1.month
  def recent           = @base - 1.week
  def today            = @base

  # Add realistic noise to a timestamp
  def around(time, spread: 2.hours)
    time + rand(-spread.to_i..spread.to_i).seconds
  end

  # Generate evenly-spread timestamps between two points
  def spread(count, from:, to:)
    step = (to - from) / (count + 1)
    count.times.map { |i| from + step * (i + 1) + rand(-1.hour.to_i..1.hour.to_i).seconds }
  end
end
```

Each scenario defines its own timeline by instantiating `Timeline` (or a subclass with scenario-specific anchors).

### First Scenario: BrightPath Media (Marketing Agency)

**People** (6 users):

| Name | Role | Persona |
|------|------|---------|
| Sarah Chen | CEO / Founder | Sets up workspace, writes policies, oversees strategy |
| James Rivera | Creative Director | Leads campaign ideation, writes briefs |
| Priya Patel | Account Manager | Manages client relationships, tracks campaigns |
| Marcus Thompson | Content Creator | Writes copy, uploads assets |
| Elena Vasquez | Social Media Manager | Posting schedules, metrics tracking |
| Alex Kim | Junior Designer | New hire, goes through onboarding |

**Spaces** (3):
- BrightPath HQ (public) -- policies, onboarding, announcements
- Client Projects (restricted) -- campaign work, briefs, trackers
- Creative Lab (public) -- brainstorming, templates, ideas

**Documents** (~15): mix of policies, client strategies, campaign briefs, brainstorms, meeting notes, onboarding checklists. Some embed tables via `advancedTable` blocks and charts via `chartBlock`.

**Tables** (5): Campaign Tracker, Content Calendar, Vacation Tracker, Client Contacts, Expense Reports. Each with typed columns and realistic row data.

**Interactions**: ~10 comments and a few reactions on key documents, spread across the timeline. Enough to make the workspace feel alive without being overwhelming.

**Timeline narrative** (documented in README.md):
- 3 months ago: BrightPath founded, Sarah sets up workspace
- Week 1: Team invited, policies and onboarding docs created
- Month 1: First client (GreenLeaf Organics) onboarded, campaign planning starts
- Month 2: Second client (UrbanFit), team in steady state
- Last week: New prospect (TechNova), active proposal work
- Today: workspace alive with recent activity

### AI-Assisted Scenario Generator

`bin/generate-seed` takes a scenario description and uses the Claude CLI to generate a complete first draft:

```bash
bin/generate-seed "A design studio called PixelCraft with 8 people,
  managing branding projects for clients, tracking design sprints"
```

The script:
1. Creates the directory structure under `db/seeds/organizations/<slug>/`
2. Calls `claude -p` with a detailed prompt that includes the conventions (markdown custom block syntax, YAML table schema format, Oaken DSL, Timeline usage) and a reference README from an existing scenario
3. Claude generates: README.md, seed.rb, all markdown documents, YAML schemas, CSV data files
4. Files are written to the new directory for human review and iteration

The prompt template lives in `db/seeds/generator/prompt_template.md` so it can evolve with the conventions.

## RSpec Integration (Future)

Oaken supports sharing seed data with tests. When ready:

```ruby
# spec/rails_helper.rb
require "oaken/rspec_setup"
```

This gives tests access to named records (`users.sarah`, `organizations.brightpath`) and the same dataset developers see in their browser.

## Adding a New Scenario Checklist

1. Run `bin/generate-seed "<description>"` or manually create `db/seeds/organizations/<name>/`
2. Write/edit `README.md` with narrative, timeline, people, spaces, tables, documents
3. Author markdown documents in `content/documents/`
4. Define table schemas (YAML) and data (CSV) in `content/tables/`
5. Write `seed.rb` using Oaken DSL + helpers
6. Add org name to `SEED_ORG_NAMES` in `db/seeds.rb`
7. Run `rails db:seed` to verify
