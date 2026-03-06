# Seed System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an Oaken-based development seeding system that produces realistic workspace data from markdown documents and CSV tables, with a marketing agency as the first scenario.

**Architecture:** Oaken gem provides the seed DSL and future test integration. Content is authored as markdown files (converted to BlockNote/YJS at seed time via BlocknoteConverterService) and YAML+CSV table definitions. A Timeline class handles relative timestamps. Each scenario lives in its own directory under `db/seeds/organizations/`.

**Tech Stack:** Ruby on Rails 8.1, Oaken gem, BlocknoteConverterService (Node.js micro-service), Devise, PostgreSQL

**Prerequisites:** The blocknote-converter must be built (`cd micro-services/blocknote-converter && npm install && npm run build`) before seeds can run, since `BlocknoteConverterService` shells out to `build/blocknoteConverter.cjs`.

---

### Task 1: Install Oaken and Wire Up db/seeds.rb

**Files:**
- Modify: `Gemfile`
- Modify: `db/seeds.rb`
- Create: `db/seeds/setup.rb`

**Step 1: Add oaken to Gemfile**

Add to the development/test group in `Gemfile`:

```ruby
group :development, :test do
  gem "oaken"
end
```

**Step 2: Install the gem**

Run: `bundle install`
Expected: oaken gem installed successfully

**Step 3: Replace db/seeds.rb**

Replace the contents of `db/seeds.rb`. Keep the existing standalone logic, add development seed logic:

```ruby
# db/seeds.rb

# Standalone mode seeding (production/self-hosted)
if Flipper.enabled?(:standalone)
  DatabaseId.upsert(ActiveRecord::Base.connection)

  organization = Organization.find_or_create_by!(
    name: ENV.fetch("FUNDAMENTO_ORGANIZATION", "Acme Inc.")
  )

  administrator = User.find_or_create_by!(email: ENV.fetch("FUNDAMENTO_ADMIN_EMAIL", "root@localhost")) do |user|
    user.first_name = ENV.fetch("FUNDAMENTO_ADMIN_FIRST_NAME", "Root")
    user.last_name = ENV.fetch("FUNDAMENTO_ADMIN_LAST_NAME", "Beloved")
    user.password = ENV.fetch("FUNDAMENTO_ADMIN_PASSWORD", "password!")
  end

  organization.organization_memberships.find_or_create_by!(user: administrator)
  return
end

# Development seed data
return unless Rails.env.development?

Oaken.seed :organizations
```

**Step 4: Create minimal setup.rb**

Create `db/seeds/setup.rb` with just enough to verify Oaken works:

```ruby
# db/seeds/setup.rb
# Oaken setup: defaults, helpers, model registrations

puts "[Seeds] Setup loaded"
```

**Step 5: Verify Oaken loads**

Run: `bin/rails db:seed`
Expected: prints "[Seeds] Setup loaded" without errors. No organizations directory yet so nothing else happens.

**Step 6: Commit**

```bash
git add Gemfile Gemfile.lock db/seeds.rb db/seeds/setup.rb
git commit -m "Install Oaken gem and wire up db/seeds.rb entry point"
```

---

### Task 2: Build the Setup Layer (Defaults, Model Registration, Helpers)

**Files:**
- Modify: `db/seeds/setup.rb`
- Create: `db/seeds/setup/timeline.rb`
- Create: `db/seeds/setup/documents.rb`
- Create: `db/seeds/setup/tables.rb`

**Step 1: Write setup.rb with defaults and model registrations**

```ruby
# db/seeds/setup.rb
# Oaken setup: defaults, helpers, model registrations

# Register namespaced models that Oaken's auto-resolver can't find
loader.register Tables::Column, as: :tables_columns
loader.register Tables::Row, as: :tables_rows
loader.register Tables::Cell, as: :tables_cells

section :user_defaults do
  users.defaults password: "password"

  # Auto-confirm all seed users (Devise confirmable)
  def users.create(label = nil, unique_by: :email, **attrs)
    record = super(label, unique_by: unique_by, **attrs)
    record.confirm unless record.confirmed?
    record
  end
end

section :organization_helpers do
  # Create org without triggering after_create :create_default_space callback
  # which would auto-create a space with onboarding content
  def organizations.create_seed(label = nil, **attrs)
    Organization.skip_callback(:create, :after, :create_default_space)
    result = create(label, **attrs)
    Organization.set_callback(:create, :after, :create_default_space)
    result
  end
end

section :space_helpers do
  # Create space without triggering after_create :create_home_document! callback
  def spaces.create_seed(label = nil, **attrs)
    Space.skip_callback(:create, :after, :create_home_document!)
    result = create(label, **attrs)
    Space.set_callback(:create, :after, :create_home_document!)
    result
  end
end
```

**Step 2: Write the Timeline helper**

```ruby
# db/seeds/setup/timeline.rb

class SeedTimeline
  def initialize
    @base = Time.current
  end

  # Named anchors for a ~3-month scenario history
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
    return [] if count <= 0

    step = (to - from) / (count + 1)
    count.times.map { |i| from + step * (i + 1) + rand(-1.hour.to_i..1.hour.to_i).seconds }
  end
end

def self.timeline
  @timeline ||= SeedTimeline.new
end
```

**Step 3: Write the document creation helper**

```ruby
# db/seeds/setup/documents.rb

section :document_helpers do
  # Helper to derive a title from a markdown filename
  # "greenleaf-gtm-strategy.md" -> "Greenleaf Gtm Strategy"
  def documents.title_from_filename(path)
    File.basename(path, ".md").tr("-", " ").split.map(&:capitalize).join(" ")
  end

  # Resolve PLACEHOLDER_* tokens in BlockNote blocks JSON with actual NPIs.
  # table_placeholders is a hash: { "campaign_tracker" => <Table record>, ... }
  # Replaces PLACEHOLDER_campaign_tracker with the table's actual NPI in tableNpi props.
  # Also resolves column placeholders: PLACEHOLDER_<column_name_snake> with the column's NPI.
  def documents.resolve_placeholders!(blocks, table_placeholders)
    return blocks if table_placeholders.empty?

    json_str = blocks.to_json

    table_placeholders.each do |placeholder_key, table|
      # Replace table NPI placeholder
      json_str.gsub!("PLACEHOLDER_#{placeholder_key}", table.id)

      # Replace column NPI placeholders
      table.columns.each do |col|
        col_key = col.name.downcase.gsub(/\s+/, "_")
        json_str.gsub!("PLACEHOLDER_#{col_key}", col.id)
      end
    end

    JSON.parse(json_str)
  end

  # Create a document from a markdown file, converting to BlockNote/YJS.
  # Options:
  #   markdown_path: - absolute path to the .md file
  #   space: - the Space record
  #   organization: - the Organization record
  #   author: - (optional) User who created it, used for the Version record
  #   table_placeholders: - (optional) hash of { "name" => Table } for NPI resolution
  #   title: - (optional) override title, otherwise derived from filename
  #   parent_document_id: - (optional) ID of parent doc in hierarchy for nesting
  def documents.create_from_markdown(label = nil, markdown_path:, space:, organization:, author: nil, table_placeholders: {}, parent_document_id: nil, **attrs)
    markdown = File.read(markdown_path)
    blocks = BlocknoteConverterService.markdown_to_blocks(markdown)

    # Resolve table/column NPI placeholders if any
    blocks = resolve_placeholders!(blocks, table_placeholders) if table_placeholders.any?

    yjs_binary = BlocknoteConverterService.blocks_to_yjs(blocks)

    title = attrs.delete(:title) || title_from_filename(markdown_path)

    doc = create(label,
      title: title,
      sync: yjs_binary,
      space: space,
      organization: organization,
      **attrs
    )

    Version.create!(
      document: doc,
      content_blocks: blocks,
      created_by: author
    )

    # Add to space hierarchy
    if parent_document_id
      node = space.create_hierarchy_node(doc.id)
      space.add_item_to_hierarchy!(space.hierarchy, parent_document_id, node)
    else
      space.hierarchy.append(space.create_hierarchy_node(doc.id))
    end
    space.save!

    puts "  [Document] #{title}"
    doc
  end
end
```

**Step 4: Write the table creation helper**

```ruby
# db/seeds/setup/tables.rb

section :table_helpers do
  # Create a table from a YAML definition file + CSV data file.
  # The YAML file defines column names and kinds.
  # The CSV file provides the row data.
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

    # Import rows from CSV, mapping values to columns by header order
    columns_in_order = []
    prev_row = nil

    CSV.foreach(csv_path, headers: true) do |csv_row|
      # On first data row, build column lookup by header name
      if columns_in_order.empty?
        columns_in_order = csv_row.headers.map { |h| table.columns.find_by!(name: h) }
      end

      row = context.tables_rows.create(
        table: table,
        previous_row: prev_row,
        organization: organization
      )

      columns_in_order.each_with_index do |col, i|
        context.tables_cells.create(
          table: table,
          column: col,
          row: row,
          value: csv_row[i],
          organization: organization
        )
      end

      prev_row = row
    end

    puts "  [Table] #{defn["name"]} (#{table.rows.count} rows)"
    table
  end
end
```

**Step 5: Verify setup loads without error**

Run: `bin/rails db:seed`
Expected: prints "[Seeds] Setup loaded" (from the puts we'll remove later). No errors about undefined methods or missing models.

**Step 6: Commit**

```bash
git add db/seeds/setup.rb db/seeds/setup/
git commit -m "Add Oaken setup layer: timeline, document, and table helpers"
```

---

### Task 3: Create the Marketing Agency Scenario Scaffold

**Files:**
- Create: `db/seeds/organizations/marketing_agency/README.md`
- Create: `db/seeds/organizations/marketing_agency/seed.rb`

**Step 1: Write the scenario README**

Create `db/seeds/organizations/marketing_agency/README.md`:

```markdown
# Seed Scenario: BrightPath Media (Marketing Agency)

## Context

BrightPath Media is a 6-person marketing agency that handles social media campaigns
for multiple clients. This scenario demonstrates a realistic collaborative workspace
with documents, tables, comments, and reactions.

## People

| Name             | Email                              | Role    | Persona                                        |
|------------------|------------------------------------|---------|-------------------------------------------------|
| Sarah Chen       | sarah@brightpath.example.com       | Manager | CEO/Founder. Sets up workspace, writes policies |
| James Rivera     | james@brightpath.example.com       | Member  | Creative Director. Campaign ideation, briefs     |
| Priya Patel      | priya@brightpath.example.com       | Member  | Account Manager. Client relationships, tracking  |
| Marcus Thompson  | marcus@brightpath.example.com      | Member  | Content Creator. Writes copy, uploads assets     |
| Elena Vasquez    | elena@brightpath.example.com       | Member  | Social Media Manager. Scheduling, metrics        |
| Alex Kim         | alex@brightpath.example.com        | Member  | Junior Designer. New hire, onboarding            |

## Spaces

| Space           | Access     | Purpose                                        |
|-----------------|------------|------------------------------------------------|
| BrightPath HQ   | public     | Company-wide: policies, onboarding, meetings   |
| Client Projects | restricted | Campaign work: briefs, strategies, trackers    |
| Creative Lab    | public     | Brainstorming, templates, design guidelines    |

## Documents

### BrightPath HQ
- Welcome to BrightPath (home-like doc)
- Vacation & PTO Policy
- Travel Reimbursement Policy
- Out of Office Guidelines
- New Hire Onboarding Checklist
- Team Meeting Notes

### Client Projects
- GreenLeaf Organics - GTM Strategy (embeds Campaign Tracker table + chart)
- GreenLeaf Organics - Q1 Campaign Brief
- UrbanFit - Brand Voice Guide
- UrbanFit - Instagram Campaign Plan
- TechNova - Proposal Draft (recent, in-progress feel)

### Creative Lab
- Content Calendar Template (embeds Content Calendar table)
- Campaign Brainstorm: Spring Collection Ideas
- Design System & Brand Guidelines

## Tables

| Table              | Space           | Key Columns                                           | ~Rows |
|--------------------|-----------------|-------------------------------------------------------|-------|
| Campaign Tracker   | Client Projects | Campaign, Client, Start Date, Budget, Status, Impressions | 12 |
| Content Calendar   | Client Projects | Week, Platform, Content Type, Author, Status          | 20    |
| Vacation Tracker   | BrightPath HQ   | Name, Start Date, End Date, Type, Status              | 8     |
| Client Contacts    | Client Projects | Client, Contact, Email, Role                          | 6     |
| Expense Reports    | BrightPath HQ   | Date, Employee, Category, Amount, Status              | 15    |

## Timeline

- **3 months ago**: BrightPath Media founded. Sarah sets up the workspace.
- **Week 1**: Sarah invites the team. Policies and onboarding docs created.
- **~2.5 months ago**: Onboarding complete. Team ramping up.
- **~2 months ago**: First client (GreenLeaf Organics) onboarded. Campaign planning begins.
- **~1 month ago**: Second client (UrbanFit) signed. Steady state operations.
- **~1 week ago**: New prospect (TechNova). Active proposal work. Alex Kim joins as new hire.
- **Today**: Workspace is alive with recent activity.

## Key Interactions

- Sarah comments on TechNova proposal encouraging James
- Priya asks a question on GreenLeaf GTM strategy, James replies
- Marcus reacts to the brainstorm doc with thumbs up
- Alex comments on onboarding checklist with a question, Sarah answers
- Elena comments on content calendar about a scheduling conflict
```

**Step 2: Write the scenario seed.rb scaffold**

Create `db/seeds/organizations/marketing_agency/seed.rb`. This is the main script that creates the entire scenario. Start with just org + users + spaces to verify the pipeline works:

```ruby
# db/seeds/organizations/marketing_agency/seed.rb
#
# Seed scenario: BrightPath Media - a 6-person marketing agency.
# See README.md in this directory for full narrative context.

puts "\n=== Seeding: BrightPath Media (Marketing Agency) ==="

t = timeline

# Helper to resolve content paths relative to this scenario directory
scenario_dir = Pathname.new(__dir__)
def self.content_path(relative)
  scenario_dir.join("content", relative)
end

# ─── Organization ───────────────────────────────────────────────

org = organizations.create_seed :brightpath,
  name: "BrightPath Media",
  created_at: t.company_founded,
  updated_at: t.company_founded

# ─── Users ──────────────────────────────────────────────────────

sarah = users.create :sarah_chen,
  first_name: "Sarah", last_name: "Chen",
  email: "sarah@brightpath.example.com"

james = users.create :james_rivera,
  first_name: "James", last_name: "Rivera",
  email: "james@brightpath.example.com"

priya = users.create :priya_patel,
  first_name: "Priya", last_name: "Patel",
  email: "priya@brightpath.example.com"

marcus = users.create :marcus_thompson,
  first_name: "Marcus", last_name: "Thompson",
  email: "marcus@brightpath.example.com"

elena = users.create :elena_vasquez,
  first_name: "Elena", last_name: "Vasquez",
  email: "elena@brightpath.example.com"

alex = users.create :alex_kim,
  first_name: "Alex", last_name: "Kim",
  email: "alex@brightpath.example.com"

# ─── Organization Memberships ──────────────────────────────────

sarah_membership = organization_memberships.create :sarah_membership,
  user: sarah, organization: org, role: :manager,
  created_at: t.company_founded, updated_at: t.company_founded

james_membership = organization_memberships.create :james_membership,
  user: james, organization: org, role: :member,
  created_at: t.around(t.first_week), updated_at: t.around(t.first_week)

priya_membership = organization_memberships.create :priya_membership,
  user: priya, organization: org, role: :member,
  created_at: t.around(t.first_week), updated_at: t.around(t.first_week)

marcus_membership = organization_memberships.create :marcus_membership,
  user: marcus, organization: org, role: :member,
  created_at: t.around(t.first_week + 2.days), updated_at: t.around(t.first_week + 2.days)

elena_membership = organization_memberships.create :elena_membership,
  user: elena, organization: org, role: :member,
  created_at: t.around(t.first_week + 3.days), updated_at: t.around(t.first_week + 3.days)

alex_membership = organization_memberships.create :alex_membership,
  user: alex, organization: org, role: :member,
  created_at: t.around(t.recent), updated_at: t.around(t.recent)

# ─── Spaces ─────────────────────────────────────────────────────

hq_space = spaces.create_seed :brightpath_hq,
  name: "BrightPath HQ", organization: org, access_mode: :public,
  created_at: t.company_founded, updated_at: t.company_founded

client_space = spaces.create_seed :client_projects,
  name: "Client Projects", organization: org, access_mode: :restricted,
  created_at: t.around(t.first_week), updated_at: t.around(t.steady_state)

creative_space = spaces.create_seed :creative_lab,
  name: "Creative Lab", organization: org, access_mode: :public,
  created_at: t.around(t.first_week + 1.day), updated_at: t.around(t.steady_state)

# ─── Tables ─────────────────────────────────────────────────────
# Created before documents so we can reference their NPIs in markdown placeholders

campaign_tracker = tables.create_from_definition :campaign_tracker,
  definition_path: content_path("tables/campaign-tracker.yml"),
  space: client_space, organization: org,
  created_at: t.around(t.ramp_up), updated_at: t.around(t.steady_state)

content_calendar = tables.create_from_definition :content_calendar,
  definition_path: content_path("tables/content-calendar.yml"),
  space: client_space, organization: org,
  created_at: t.around(t.ramp_up + 1.week), updated_at: t.around(t.recent)

vacation_tracker = tables.create_from_definition :vacation_tracker,
  definition_path: content_path("tables/vacation-tracker.yml"),
  space: hq_space, organization: org,
  created_at: t.around(t.first_week + 3.days), updated_at: t.around(t.steady_state)

client_contacts = tables.create_from_definition :client_contacts,
  definition_path: content_path("tables/client-contacts.yml"),
  space: client_space, organization: org,
  created_at: t.around(t.ramp_up), updated_at: t.around(t.steady_state)

expense_reports = tables.create_from_definition :expense_reports,
  definition_path: content_path("tables/expense-reports.yml"),
  space: hq_space, organization: org,
  created_at: t.around(t.ramp_up + 2.weeks), updated_at: t.around(t.recent)

# ─── Documents: BrightPath HQ ──────────────────────────────────

welcome_doc = documents.create_from_markdown :bp_welcome,
  markdown_path: content_path("documents/welcome-to-brightpath.md"),
  space: hq_space, organization: org, author: sarah,
  created_at: t.company_founded, updated_at: t.around(t.first_week)

# Set as home document for the HQ space
hq_space.update!(home_document: welcome_doc)

vacation_doc = documents.create_from_markdown :bp_vacation_policy,
  markdown_path: content_path("documents/vacation-policy.md"),
  space: hq_space, organization: org, author: sarah,
  created_at: t.around(t.first_week), updated_at: t.around(t.onboarding_done)

travel_doc = documents.create_from_markdown :bp_travel_reimbursement,
  markdown_path: content_path("documents/travel-reimbursement-policy.md"),
  space: hq_space, organization: org, author: sarah,
  created_at: t.around(t.first_week + 1.day), updated_at: t.around(t.onboarding_done)

ooo_doc = documents.create_from_markdown :bp_out_of_office,
  markdown_path: content_path("documents/out-of-office-guidelines.md"),
  space: hq_space, organization: org, author: sarah,
  created_at: t.around(t.first_week + 1.day), updated_at: t.around(t.onboarding_done)

onboarding_doc = documents.create_from_markdown :bp_onboarding_checklist,
  markdown_path: content_path("documents/new-hire-onboarding-checklist.md"),
  space: hq_space, organization: org, author: sarah,
  created_at: t.around(t.first_week + 2.days), updated_at: t.around(t.recent)

meeting_doc = documents.create_from_markdown :bp_meeting_notes,
  markdown_path: content_path("documents/team-meeting-notes.md"),
  space: hq_space, organization: org, author: sarah,
  table_placeholders: { "vacation_tracker" => vacation_tracker },
  created_at: t.around(t.recent), updated_at: t.around(t.recent + 1.day)

# ─── Documents: Client Projects ────────────────────────────────

gtm_doc = documents.create_from_markdown :greenleaf_gtm,
  markdown_path: content_path("documents/greenleaf-gtm-strategy.md"),
  space: client_space, organization: org, author: james,
  table_placeholders: { "campaign_tracker" => campaign_tracker },
  created_at: t.around(t.ramp_up), updated_at: t.around(t.steady_state)

campaign_brief_doc = documents.create_from_markdown :greenleaf_q1_brief,
  markdown_path: content_path("documents/greenleaf-q1-campaign-brief.md"),
  space: client_space, organization: org, author: james,
  created_at: t.around(t.ramp_up + 1.week), updated_at: t.around(t.steady_state)

brand_voice_doc = documents.create_from_markdown :urbanfit_brand_voice,
  markdown_path: content_path("documents/urbanfit-brand-voice-guide.md"),
  space: client_space, organization: org, author: priya,
  created_at: t.around(t.steady_state), updated_at: t.around(t.steady_state + 1.week)

instagram_doc = documents.create_from_markdown :urbanfit_instagram,
  markdown_path: content_path("documents/urbanfit-instagram-campaign.md"),
  space: client_space, organization: org, author: elena,
  created_at: t.around(t.steady_state + 3.days), updated_at: t.around(t.recent)

technova_doc = documents.create_from_markdown :technova_proposal,
  markdown_path: content_path("documents/technova-proposal-draft.md"),
  space: client_space, organization: org, author: james,
  created_at: t.around(t.recent), updated_at: t.around(t.today)

# ─── Documents: Creative Lab ───────────────────────────────────

calendar_template_doc = documents.create_from_markdown :content_calendar_template,
  markdown_path: content_path("documents/content-calendar-template.md"),
  space: creative_space, organization: org, author: elena,
  table_placeholders: { "content_calendar" => content_calendar },
  created_at: t.around(t.ramp_up + 2.weeks), updated_at: t.around(t.steady_state)

brainstorm_doc = documents.create_from_markdown :spring_brainstorm,
  markdown_path: content_path("documents/campaign-brainstorm-spring.md"),
  space: creative_space, organization: org, author: james,
  created_at: t.around(t.steady_state + 1.week), updated_at: t.around(t.recent)

design_doc = documents.create_from_markdown :design_guidelines,
  markdown_path: content_path("documents/design-system-guidelines.md"),
  space: creative_space, organization: org, author: marcus,
  created_at: t.around(t.onboarding_done), updated_at: t.around(t.steady_state)

# ─── Comments ───────────────────────────────────────────────────
# BlockNote stores comment content as JSON blocks, but for seed purposes
# we use a simple paragraph block structure.

def self.comment_content(text)
  [{ "type" => "paragraph", "content" => [{ "type" => "text", "text" => text }] }]
end

# Sarah encourages James on the TechNova proposal
object_comments.create(
  organization: org, organization_membership: sarah_membership,
  object: technova_doc,
  content: comment_content("This looks great, James! I love the data-driven approach. Let's make sure we highlight our social media analytics capabilities in the pitch."),
  created_at: t.around(t.recent + 1.day), updated_at: t.around(t.recent + 1.day)
)

# Priya asks about GTM strategy, James replies
priya_gtm_comment = object_comments.create(
  organization: org, organization_membership: priya_membership,
  object: gtm_doc,
  content: comment_content("Should we increase the Instagram budget for Q2? The engagement metrics from GreenLeaf's last campaign were really strong on that platform."),
  created_at: t.around(t.ramp_up + 5.days), updated_at: t.around(t.ramp_up + 5.days)
)

object_comments.create(
  organization: org, organization_membership: james_membership,
  object: gtm_doc,
  content: comment_content("Good call, Priya. I've updated the budget split. Let's review it in the next client sync."),
  created_at: t.around(t.ramp_up + 6.days), updated_at: t.around(t.ramp_up + 6.days)
)

# Alex asks about onboarding, Sarah answers
object_comments.create(
  organization: org, organization_membership: alex_membership,
  object: onboarding_doc,
  content: comment_content("Hi! Quick question - should I set up my accounts on all the social platforms listed here, or just the ones for my assigned clients?"),
  created_at: t.around(t.recent + 2.days), updated_at: t.around(t.recent + 2.days)
)

object_comments.create(
  organization: org, organization_membership: sarah_membership,
  object: onboarding_doc,
  content: comment_content("Great question, Alex! Just set up accounts for the platforms your assigned clients use. James will walk you through the specifics in your 1:1 tomorrow."),
  created_at: t.around(t.recent + 2.days + 3.hours), updated_at: t.around(t.recent + 2.days + 3.hours)
)

# Elena comments on content calendar
object_comments.create(
  organization: org, organization_membership: elena_membership,
  object: calendar_template_doc,
  content: comment_content("Heads up - there's a scheduling conflict for the GreenLeaf posts next Tuesday. I've moved them to Wednesday to avoid overlap with the UrbanFit launch."),
  created_at: t.around(t.recent + 3.days), updated_at: t.around(t.recent + 3.days)
)

# ─── Reactions ──────────────────────────────────────────────────

# Marcus reacts to the brainstorm doc
object_reactions.create(
  organization: org, organization_membership: marcus_membership,
  object: brainstorm_doc, emoji: "👍",
  created_at: t.around(t.steady_state + 1.week + 1.day)
)

# Sarah reacts to the GTM strategy
object_reactions.create(
  organization: org, organization_membership: sarah_membership,
  object: gtm_doc, emoji: "🎯",
  created_at: t.around(t.ramp_up + 2.days)
)

# Elena reacts to Priya's GTM comment
object_reactions.create(
  organization: org, organization_membership: elena_membership,
  object: priya_gtm_comment, emoji: "👍",
  created_at: t.around(t.ramp_up + 5.days + 2.hours)
)

puts "=== Done: BrightPath Media ===\n\n"
```

**Step 3: Commit the scaffold**

```bash
git add db/seeds/organizations/marketing_agency/
git commit -m "Add marketing agency scenario scaffold (README + seed.rb)"
```

---

### Task 4: Author the Table Definitions (YAML + CSV)

**Files:**
- Create: `db/seeds/organizations/marketing_agency/content/tables/campaign-tracker.yml`
- Create: `db/seeds/organizations/marketing_agency/content/tables/campaign-tracker.csv`
- Create: `db/seeds/organizations/marketing_agency/content/tables/content-calendar.yml`
- Create: `db/seeds/organizations/marketing_agency/content/tables/content-calendar.csv`
- Create: `db/seeds/organizations/marketing_agency/content/tables/vacation-tracker.yml`
- Create: `db/seeds/organizations/marketing_agency/content/tables/vacation-tracker.csv`
- Create: `db/seeds/organizations/marketing_agency/content/tables/client-contacts.yml`
- Create: `db/seeds/organizations/marketing_agency/content/tables/client-contacts.csv`
- Create: `db/seeds/organizations/marketing_agency/content/tables/expense-reports.yml`
- Create: `db/seeds/organizations/marketing_agency/content/tables/expense-reports.csv`

This is a content-authoring task. Author all 5 table definition YAML files and their companion CSV data files. The content should be realistic for a marketing agency. Use relative date descriptions in CSV where appropriate (the seed code processes dates at import time so use actual date strings that look recent).

Each YAML file follows this format:

```yaml
name: "Table Name"
columns:
  - name: "Column Name"
    kind: string|number|decimal|date|datetime|select|checkbox|url|long_text
data: filename.csv
```

Each CSV file has headers matching the column names and realistic row data.

**Important:** CSV headers must exactly match the `name` values in the YAML columns list. The column `kind` in YAML controls the column type in Fundamento (string, number, decimal, date, select, etc.).

**Commit after authoring all 10 files:**

```bash
git add db/seeds/organizations/marketing_agency/content/tables/
git commit -m "Add table definitions and data for marketing agency scenario"
```

---

### Task 5: Author the Markdown Documents

**Files:**
- Create: 14 markdown files in `db/seeds/organizations/marketing_agency/content/documents/`

This is a content-authoring task. Author all markdown documents listed in the README. Each document should:

- Feel authentic for a marketing agency workspace
- Be 100-400 words (concise but substantive)
- Use proper markdown formatting (headings, lists, bold, links, code blocks where appropriate)
- Where specified in seed.rb, include custom block HTML for table/chart embeds

Documents that embed tables must include the placeholder syntax. For example, `greenleaf-gtm-strategy.md` should include:

```html
<div data-content-type="advancedTable" data-table-npi="PLACEHOLDER_campaign_tracker">Table</div>
```

And optionally a chart:

```html
<div data-content-type="chartBlock" data-table-npi="PLACEHOLDER_campaign_tracker" data-title="Campaign Performance" data-chart-type="bar" data-x-axis-column-npi="PLACEHOLDER_campaign" data-y-axis-column-npi="PLACEHOLDER_impressions">Chart</div>
```

Documents to create:

1. `welcome-to-brightpath.md` - Welcome doc with company mission, team overview, key links
2. `vacation-policy.md` - PTO policy with accrual, approval process, blackout dates
3. `travel-reimbursement-policy.md` - Expense categories, limits, submission process
4. `out-of-office-guidelines.md` - How to set OOO, handoff process, escalation
5. `new-hire-onboarding-checklist.md` - Checklist with checkboxes for new hire tasks
6. `team-meeting-notes.md` - Recent team meeting notes, embeds vacation tracker
7. `greenleaf-gtm-strategy.md` - GTM strategy, embeds campaign tracker + chart
8. `greenleaf-q1-campaign-brief.md` - Creative brief for Q1 campaign
9. `urbanfit-brand-voice-guide.md` - Brand voice, tone, messaging guidelines
10. `urbanfit-instagram-campaign.md` - Instagram campaign plan with content pillars
11. `technova-proposal-draft.md` - New client proposal (draft feel, incomplete sections)
12. `content-calendar-template.md` - How to use the content calendar, embeds table
13. `campaign-brainstorm-spring.md` - Brainstorm ideas, rough/creative feel
14. `design-system-guidelines.md` - Brand guidelines, colors, typography, assets

**Commit after authoring all documents:**

```bash
git add db/seeds/organizations/marketing_agency/content/documents/
git commit -m "Add markdown documents for marketing agency scenario"
```

---

### Task 6: Wire Up Clean-Slate Deletion in db/seeds.rb

**Files:**
- Modify: `db/seeds.rb`

**Step 1: Add clean-slate deletion before seeding**

Update `db/seeds.rb` to destroy seed-managed data before re-seeding:

```ruby
# db/seeds.rb

# Standalone mode seeding (production/self-hosted)
if Flipper.enabled?(:standalone)
  DatabaseId.upsert(ActiveRecord::Base.connection)

  organization = Organization.find_or_create_by!(
    name: ENV.fetch("FUNDAMENTO_ORGANIZATION", "Acme Inc.")
  )

  administrator = User.find_or_create_by!(email: ENV.fetch("FUNDAMENTO_ADMIN_EMAIL", "root@localhost")) do |user|
    user.first_name = ENV.fetch("FUNDAMENTO_ADMIN_FIRST_NAME", "Root")
    user.last_name = ENV.fetch("FUNDAMENTO_ADMIN_LAST_NAME", "Beloved")
    user.password = ENV.fetch("FUNDAMENTO_ADMIN_PASSWORD", "password!")
  end

  organization.organization_memberships.find_or_create_by!(user: administrator)
  return
end

# Development seed data
return unless Rails.env.development?

# Seed organization names - add new scenarios here
SEED_ORG_NAMES = [
  "BrightPath Media"
].freeze

# Seed user email domains - one per scenario
SEED_EMAIL_DOMAINS = [
  "@brightpath.example.com"
].freeze

puts "Cleaning previous seed data..."
Organization.where(name: SEED_ORG_NAMES).destroy_all
SEED_EMAIL_DOMAINS.each { |domain| User.where("email LIKE ?", "%#{domain}").destroy_all }

puts "Seeding development data..."
Oaken.seed :organizations
puts "Done!"
```

**Step 2: Commit**

```bash
git add db/seeds.rb
git commit -m "Add clean-slate deletion for seed organizations before re-seeding"
```

---

### Task 7: End-to-End Test Run and Debug

**Step 1: Ensure blocknote-converter is built**

Run: `cd micro-services/blocknote-converter && npm install && npm run build`
Expected: Build succeeds, `build/blocknoteConverter.cjs` exists

**Step 2: Run the full seed**

Run: `bin/rails db:seed`
Expected: All records created without errors. Output shows each document and table being created.

**Step 3: Debug any issues**

Common issues to watch for:
- `BlocknoteConverterService::ConversionError` -- blocknote-converter not built
- `ActiveRecord::RecordInvalid` -- missing required fields, uniqueness violations
- `Oaken` method_missing errors -- model not auto-resolved, needs manual `register`
- Callback issues -- `skip_callback`/`set_callback` not balanced
- CSV parsing errors -- header mismatch between YAML and CSV

Fix any issues, re-run `bin/rails db:seed` until it completes cleanly.

**Step 4: Verify in browser**

Run: `bin/dev`
Navigate to `http://localhost:3000`, sign in as `sarah@brightpath.example.com` / `password`.
Verify:
- BrightPath Media organization exists
- All 3 spaces are visible
- Documents load with proper formatting
- Tables display with correct column types and data
- Embedded tables/charts appear in documents
- Comments are visible on documents
- Timestamps look realistic (recent, not years old)

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "Fix seed issues found during end-to-end testing"
```

---

### Task 8: Create the Scenario Generator Script

**Files:**
- Create: `bin/generate-seed`
- Create: `db/seeds/generator/prompt_template.md`

**Step 1: Create the prompt template**

Create `db/seeds/generator/prompt_template.md` containing detailed instructions for Claude about the seed conventions, directory structure, YAML table schema format, markdown custom block syntax, Oaken DSL patterns, and Timeline usage. Include the marketing agency README as a reference example.

**Step 2: Create the generator script**

Create `bin/generate-seed`:

```ruby
#!/usr/bin/env ruby
# frozen_string_literal: true

# Usage: bin/generate-seed "A design studio called PixelCraft with 8 people..."
#
# Generates a first-draft seed scenario using Claude CLI.
# Review and edit the output before committing.

require "fileutils"

description = ARGV.join(" ")
if description.empty?
  puts "Usage: bin/generate-seed \"<scenario description>\""
  puts "Example: bin/generate-seed \"A design studio called PixelCraft with 8 people, managing branding projects\""
  exit 1
end

# Derive slug from description
slug = description.scan(/called (\w+)/i).flatten.first&.downcase
slug ||= description.split.first(3).join("_").downcase.gsub(/[^a-z0-9_]/, "")

output_dir = File.expand_path("../../db/seeds/organizations/#{slug}", __FILE__)

if Dir.exist?(output_dir)
  puts "Directory already exists: #{output_dir}"
  puts "Remove it first or choose a different name."
  exit 1
end

# Load prompt template and reference README
template_path = File.expand_path("../../db/seeds/generator/prompt_template.md", __FILE__)
reference_path = File.expand_path("../../db/seeds/organizations/marketing_agency/README.md", __FILE__)

unless File.exist?(template_path)
  puts "Prompt template not found: #{template_path}"
  exit 1
end

template = File.read(template_path)
reference = File.exist?(reference_path) ? File.read(reference_path) : ""

prompt = <<~PROMPT
  #{template}

  ## Reference Scenario README

  #{reference}

  ## Your Task

  Generate a complete seed scenario for Fundamento based on this description:

  #{description}

  Generate all files into the output directory. Follow the exact conventions from the template.
PROMPT

FileUtils.mkdir_p(output_dir)

puts "Generating seed scenario: #{slug}"
puts "Output directory: #{output_dir}"
puts "Running Claude CLI..."

system("claude", "-p", prompt, "--output-dir", output_dir)

if $?.success?
  puts "\nScenario generated at: #{output_dir}"
  puts "Review the generated files, edit as needed, then add to SEED_ORG_NAMES in db/seeds.rb"
else
  puts "\nGeneration failed. Check the output above for errors."
  exit 1
end
```

Make it executable: `chmod +x bin/generate-seed`

**Step 3: Commit**

```bash
git add bin/generate-seed db/seeds/generator/
git commit -m "Add AI-assisted seed scenario generator script"
```

---

### Task 9: Final Cleanup and Documentation

**Step 1: Remove debug puts from setup.rb**

Remove the `puts "[Seeds] Setup loaded"` line from `db/seeds/setup.rb` if still present.

**Step 2: Update CLAUDE.md with seed instructions**

Add a section to the project's `CLAUDE.md` about the seed system:

```markdown
### Development Seeds

Seeds use the [Oaken gem](https://github.com/kaspth/oaken) for realistic development data.

- Entry point: `db/seeds.rb` (runs `Oaken.seed :organizations`)
- Setup/helpers: `db/seeds/setup.rb` and `db/seeds/setup/`
- Scenarios: `db/seeds/organizations/<name>/` (each has README.md, seed.rb, content/)
- Content: Markdown documents in `content/documents/`, YAML+CSV tables in `content/tables/`
- Generator: `bin/generate-seed "<description>"` bootstraps new scenarios via Claude CLI

Run `bin/rails db:seed` to populate development database. Seeds are clean-slate (destroys and recreates seed orgs on each run).

The blocknote-converter must be built before seeds can run:
```bash
cd micro-services/blocknote-converter && npm install && npm run build
```
```

**Step 3: Final commit**

```bash
git add CLAUDE.md db/seeds/setup.rb
git commit -m "Clean up seed setup and document seed system in CLAUDE.md"
```
