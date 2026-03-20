# Seed User Mentions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert plain-text user name references in seed markdown documents into proper `<span data-mention="user">` markup that the blocknote-converter parses into interactive mention blocks. Extract shared block-walking logic into a `BlocknoteBlocks` service so all mention-processing code lives in one place.

**Architecture:** A new `BlocknoteBlocks` service provides `walk_blocks` and `each_mention` methods for traversing BlockNote block trees. `ObjectReferenceReconciler` and `MentionsExtractor` are refactored to use it instead of their own private walkers. The seed helper uses `BlocknoteBlocks` to find user mentions with email entity IDs and replace them with actual user NPI IDs. Markdown files use `<span data-mention="user" data-entity-id="email@example.com">Name</span>` syntax.

**Tech Stack:** Ruby on Rails services, seeds (Oaken), BlockNote converter service

---

### Task 1: Create `BlocknoteBlocks` service

**Files:**
- Create: `app/services/blocknote_blocks.rb`
- Create: `spec/services/blocknote_blocks_spec.rb`

- [ ] **Step 1: Write tests for `BlocknoteBlocks`**

```ruby
# spec/services/blocknote_blocks_spec.rb
require "rails_helper"

RSpec.describe BlocknoteBlocks do
  def paragraph_with_mention(entity:, entity_id:, title: "Test")
    {
      "id" => SecureRandom.hex(6),
      "type" => "paragraph",
      "content" => [
        {
          "type" => "mention",
          "props" => {
            "id" => SecureRandom.hex(6),
            "entity" => entity,
            "entityId" => entity_id,
            "title" => title
          }
        }
      ],
      "children" => []
    }
  end

  def nested_blocks(*inner_blocks)
    {
      "id" => SecureRandom.hex(6),
      "type" => "bulletListItem",
      "content" => [],
      "children" => inner_blocks
    }
  end

  describe ".walk_blocks" do
    it "yields each node in a flat block list" do
      blocks = [
        paragraph_with_mention(entity: "user", entity_id: "u1"),
        paragraph_with_mention(entity: "document", entity_id: "d1")
      ]

      types = []
      described_class.walk_blocks(blocks) { |node| types << node["type"] }
      expect(types).to eq(%w[paragraph mention paragraph mention])
    end

    it "yields nodes nested in children" do
      inner = paragraph_with_mention(entity: "user", entity_id: "u1")
      blocks = [nested_blocks(inner)]

      types = []
      described_class.walk_blocks(blocks) { |node| types << node["type"] }
      expect(types).to include("mention")
    end

    it "handles nil gracefully" do
      expect { described_class.walk_blocks(nil) { |_| } }.not_to raise_error
    end

    it "handles empty array" do
      nodes = []
      described_class.walk_blocks(nodes) { |_| raise "should not yield" }
    end
  end

  describe ".each_mention" do
    it "yields only mention nodes" do
      blocks = [
        paragraph_with_mention(entity: "user", entity_id: "u1"),
        { "id" => "x", "type" => "paragraph", "content" => [{ "type" => "text", "text" => "hello" }], "children" => [] }
      ]

      mentions = []
      described_class.each_mention(blocks) { |node| mentions << node }
      expect(mentions.length).to eq(1)
      expect(mentions.first.dig("props", "entityId")).to eq("u1")
    end

    it "yields mentions from nested children" do
      inner = paragraph_with_mention(entity: "document", entity_id: "d1")
      blocks = [nested_blocks(inner)]

      mentions = []
      described_class.each_mention(blocks) { |node| mentions << node }
      expect(mentions.length).to eq(1)
    end
  end

  describe ".extract_references" do
    it "extracts mention references with id, entity, entity_id, title" do
      blocks = [paragraph_with_mention(entity: "user", entity_id: "u1", title: "Sarah")]

      refs = described_class.extract_references(blocks)
      expect(refs.length).to eq(1)
      expect(refs.first).to include(entity: "user", entity_id: "u1", title: "Sarah")
    end

    it "extracts advancedTable references" do
      blocks = [
        {
          "id" => "tbl1",
          "type" => "advancedTable",
          "props" => { "tableNpi" => "abc123" },
          "content" => [],
          "children" => []
        }
      ]

      refs = described_class.extract_references(blocks)
      expect(refs.length).to eq(1)
      expect(refs.first).to include(entity: "table", entity_id: "abc123")
    end

    it "skips mentions with blank id" do
      blocks = [paragraph_with_mention(entity: "user", entity_id: "u1")]
      blocks.first["content"].first["props"]["id"] = ""

      refs = described_class.extract_references(blocks)
      expect(refs).to be_empty
    end

    it "skips mentions with entityId of -1" do
      blocks = [paragraph_with_mention(entity: "user", entity_id: -1)]

      refs = described_class.extract_references(blocks)
      expect(refs).to be_empty
    end
  end
end
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bin/rspec spec/services/blocknote_blocks_spec.rb`
Expected: FAIL — `BlocknoteBlocks` not defined.

- [ ] **Step 3: Implement `BlocknoteBlocks`**

```ruby
# app/services/blocknote_blocks.rb
class BlocknoteBlocks
  # Walk a BlockNote block tree, yielding each Hash node (blocks and inline content).
  # Traverses both "content" (inline content) and "children" (nested blocks).
  def self.walk_blocks(nodes, &block)
    return unless nodes.is_a?(Array)

    nodes.each do |node|
      next unless node.is_a?(Hash)

      yield node

      walk_blocks(node["content"], &block) if node["content"].is_a?(Array)
      walk_blocks(node["children"], &block) if node["children"].is_a?(Array)
    end
  end

  # Yield each mention node (type == "mention") in the block tree.
  def self.each_mention(blocks, &block)
    walk_blocks(blocks) do |node|
      yield node if node["type"] == "mention"
    end
  end

  # Extract structured reference data from mention and advancedTable nodes.
  # Returns an array of hashes: { id:, entity:, entity_id:, title: }
  def self.extract_references(blocks)
    references = []

    walk_blocks(blocks) do |node|
      case node["type"]
      when "mention"
        props = node["props"] || {}
        id = props["id"].to_s
        entity_id = props["entityId"]

        next if id.blank?
        next if entity_id == -1 || entity_id == "-1"

        references << {
          id: id,
          entity: props["entity"].to_s,
          entity_id: entity_id,
          title: props["title"].to_s
        }
      when "advancedTable"
        props = node["props"] || {}
        id = node["id"].to_s
        entity_id = props["tableNpi"].presence || props["tableId"].presence

        next if id.blank?
        next if entity_id.blank?

        references << {
          id: id,
          entity: "table",
          entity_id: entity_id,
          title: ""
        }
      end
    end

    references
  end
end
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bin/rspec spec/services/blocknote_blocks_spec.rb`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add app/services/blocknote_blocks.rb spec/services/blocknote_blocks_spec.rb
git commit -m "Extract BlocknoteBlocks service for shared block-tree walking

Provides walk_blocks, each_mention, and extract_references as the single
source of truth for traversing BlockNote block structures. Will be used
by ObjectReferenceReconciler, MentionsExtractor, and seed helpers."
```

---

### Task 2: Refactor `ObjectReferenceReconciler` to use `BlocknoteBlocks`

**Files:**
- Modify: `app/services/object_reference_reconciler.rb`

- [ ] **Step 1: Run existing tests to establish baseline**

Run: `bin/rspec spec/services/object_reference_reconciler_spec.rb`
Expected: All pass.

- [ ] **Step 2: Replace private `extract_references` and `walk_blocks` with `BlocknoteBlocks`**

Replace the `extract_references` call sites (lines 29, 78) to use `BlocknoteBlocks.extract_references`:

```ruby
# In reconcile method (line 29):
mention_nodes = BlocknoteBlocks.extract_references(content_blocks)

# In reconcile_comment method (line 78):
reference_nodes = BlocknoteBlocks.extract_references(comment.content)
```

Remove the private `extract_references` and `walk_blocks` methods (lines 120-170).

- [ ] **Step 3: Run tests to verify nothing broke**

Run: `bin/rspec spec/services/object_reference_reconciler_spec.rb`
Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add app/services/object_reference_reconciler.rb
git commit -m "Refactor ObjectReferenceReconciler to use BlocknoteBlocks

Replace private walk_blocks/extract_references with the shared
BlocknoteBlocks service. No behavior change."
```

---

### Task 3: Refactor `MentionsExtractor` to use `BlocknoteBlocks`

**Files:**
- Modify: `app/services/mentions_extractor.rb`

- [ ] **Step 1: Run existing tests to establish baseline**

Run: `bin/rspec spec/services/mentions_extractor_spec.rb`
Expected: All pass.

- [ ] **Step 2: Replace private `each_mention` with `BlocknoteBlocks.each_mention`**

In `mentions_from_blocknote` (line 120-134), replace the manual iteration:

```ruby
def self.mentions_from_blocknote(blocknote_document, user)
  assert blocknote_document.is_a?(Array), "BlockNote document should be an Array"

  all_mentions_ids = []

  BlocknoteBlocks.each_mention(blocknote_document) do |mention|
    if mention.dig("props", "entity") == "user" && (user.nil? || mention.dig("props", "entityId") == user.id)
      all_mentions_ids.push(mention.dig("props", "id"))
    end
  end

  all_mentions_ids
end
```

Remove the private `each_mention` method (lines 136-153).

- [ ] **Step 3: Run tests to verify nothing broke**

Run: `bin/rspec spec/services/mentions_extractor_spec.rb`
Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add app/services/mentions_extractor.rb
git commit -m "Refactor MentionsExtractor to use BlocknoteBlocks.each_mention

Replace private each_mention walker with the shared BlocknoteBlocks
service. No behavior change."
```

---

### Task 4: Add `resolve_user_mentions!` to document seed helper

**Files:**
- Modify: `db/seeds/setup/documents.rb`

- [ ] **Step 1: Add `resolve_user_mentions!` method**

Add after the `resolve_placeholders!` method (after line 33):

```ruby
# Resolve user mention email placeholders in BlockNote blocks with actual user IDs.
# Uses BlocknoteBlocks.each_mention to walk the block tree looking for user mention
# nodes whose entityId contains an email address, then replaces with actual user NPI IDs.
def documents.resolve_user_mentions!(blocks, organization)
  # First pass: collect email entityIds from user mention nodes
  emails = []
  BlocknoteBlocks.each_mention(blocks) do |node|
    props = node["props"] || {}
    next unless props["entity"] == "user"
    entity_id = props["entityId"].to_s
    emails << entity_id if entity_id.include?("@")
  end
  emails.uniq!

  return blocks if emails.empty?

  users_by_email = User.joins(:organization_memberships)
                       .where(organization_memberships: { organization: organization })
                       .where(email: emails)
                       .index_by(&:email)

  unresolved = emails - users_by_email.keys
  unresolved.each { |email| puts "  [Warning] User mention not resolved: #{email}" }

  # Second pass: replace email entityIds with user NPI IDs in-place
  BlocknoteBlocks.each_mention(blocks) do |node|
    props = node["props"] || {}
    next unless props["entity"] == "user"
    entity_id = props["entityId"].to_s
    if (user = users_by_email[entity_id])
      props["entityId"] = user.id
    end
  end

  blocks
end
```

- [ ] **Step 2: Call `resolve_user_mentions!` from `create_from_markdown`**

In the `create_from_markdown` method, add the call between `resolve_placeholders!` and `blocks_to_yjs`:

```ruby
    # Resolve table/column NPI placeholders if any tables are referenced
    blocks = resolve_placeholders!(blocks, table_placeholders) if table_placeholders.any?

    # Resolve user mention email placeholders to actual user IDs
    blocks = resolve_user_mentions!(blocks, organization)

    yjs_binary = BlocknoteConverterService.blocks_to_yjs(blocks)
```

- [ ] **Step 3: Verify seed still runs without mention markup**

Run: `bin/rails db:seed`
Expected: Seeds complete successfully (no mention markup in files yet, so `resolve_user_mentions!` returns blocks unchanged).

- [ ] **Step 4: Commit**

```bash
git add db/seeds/setup/documents.rb
git commit -m "Add resolve_user_mentions! to document seed helper

Uses BlocknoteBlocks.each_mention to find user mentions with email
entity IDs and replaces them with actual user NPI IDs, scoped to
org membership."
```

---

### Task 5: Add mention markup to `welcome-to-brightpath.md`

**Files:**
- Modify: `db/seeds/organizations/marketing_agency/content/documents/welcome-to-brightpath.md`

**Mention targets** (first/prominent references identifying each person):
- `**Sarah Chen**` → mention (team bio intro)
- `**James Rivera**` → mention
- `**Priya Patel**` → mention
- `**Marcus Thompson**` → mention
- `**Elena Vasquez**` → mention
- `**Alex Kim**` → mention

Leave plain text: prose descriptions after each name ("Sarah oversees strategy..." etc.)

- [ ] **Step 1: Replace name references with mention spans**

Each bold name becomes:
```markdown
**<span data-mention="user" data-entity-id="sarah@brightpath.example.com">Sarah Chen</span>** - Founder and CEO. Sarah oversees...
```

Apply the same pattern for all 6 team members.

- [ ] **Step 2: Commit**

```bash
git add db/seeds/organizations/marketing_agency/content/documents/welcome-to-brightpath.md
git commit -m "Add user mention markup to welcome-to-brightpath seed doc"
```

---

### Task 6: Add mention markup to `new-hire-onboarding-checklist.md`

**Files:**
- Modify: `db/seeds/organizations/marketing_agency/content/documents/new-hire-onboarding-checklist.md`

**Mention targets:**
- `Sarah` (company overview and culture) → mention
- `James` (creative process and client strategy) → mention
- `Priya` (client management and communication) → mention
- `Elena` (content scheduling and analytics tools) → mention
- `Marcus or James` → both mentions (produce first content piece)

- [ ] **Step 1: Replace name references with mention spans**

In the Week 1 team lead list:
```markdown
  - <span data-mention="user" data-entity-id="sarah@brightpath.example.com">Sarah</span> (company overview and culture)
  - <span data-mention="user" data-entity-id="james@brightpath.example.com">James</span> (creative process and client strategy)
  - <span data-mention="user" data-entity-id="priya@brightpath.example.com">Priya</span> (client management and communication)
  - <span data-mention="user" data-entity-id="elena@brightpath.example.com">Elena</span> (content scheduling and analytics tools)
```

In Week 2:
```markdown
- [ ] Produce your first piece of content (with guidance from <span data-mention="user" data-entity-id="marcus@brightpath.example.com">Marcus</span> or <span data-mention="user" data-entity-id="james@brightpath.example.com">James</span>)
```

- [ ] **Step 2: Commit**

```bash
git add db/seeds/organizations/marketing_agency/content/documents/new-hire-onboarding-checklist.md
git commit -m "Add user mention markup to new-hire-onboarding-checklist seed doc"
```

---

### Task 7: Add mention markup to `team-meeting-notes.md`

**Files:**
- Modify: `db/seeds/organizations/marketing_agency/content/documents/team-meeting-notes.md`

**Mention targets:**
- Attendees line: Sarah, James, Priya, Marcus, Elena, Alex → all mentions
- Facilitator: Sarah → mention
- Section headers: "GreenLeaf Organics (James)" → James mention, "UrbanFit (Priya)" → Priya mention, "TechNova Prospect (James)" → James mention
- In-text attributions: "Marcus produced", "Elena has the content", "Sarah reviewed" → mentions
- Action items: James, Elena, Sarah → mentions
- Open discussion: Marcus, Alex, Elena, Sarah, James, Priya → mentions where identifying who did/will do something

- [ ] **Step 1: Replace name references with mention spans**

Apply mention spans throughout the document for each contextually meaningful name reference. Keep second/third references in the same sentence as plain text when redundant.

- [ ] **Step 2: Commit**

```bash
git add db/seeds/organizations/marketing_agency/content/documents/team-meeting-notes.md
git commit -m "Add user mention markup to team-meeting-notes seed doc"
```

---

### Task 8: Add mention markup to `travel-reimbursement-policy.md`

**Files:**
- Modify: `db/seeds/organizations/marketing_agency/content/documents/travel-reimbursement-policy.md`

**Mention targets:**
- "Approved by Sarah" (approval chain) → mention
- "Contact Sarah for policy questions" → mention

- [ ] **Step 1: Replace name references with mention spans**
- [ ] **Step 2: Commit**

```bash
git add db/seeds/organizations/marketing_agency/content/documents/travel-reimbursement-policy.md
git commit -m "Add user mention markup to travel-reimbursement-policy seed doc"
```

---

### Task 9: Add mention markup to `vacation-policy.md`

**Files:**
- Modify: `db/seeds/organizations/marketing_agency/content/documents/vacation-policy.md`

**Mention targets:**
- "check with Sarah" → mention
- "check with your account manager or Sarah" → Sarah mention
- "reach out to Sarah" → mention

- [ ] **Step 1: Replace name references with mention spans**
- [ ] **Step 2: Commit**

```bash
git add db/seeds/organizations/marketing_agency/content/documents/vacation-policy.md
git commit -m "Add user mention markup to vacation-policy seed doc"
```

---

### Task 10: Add mention markup to `greenleaf-gtm-strategy.md`

**Files:**
- Modify: `db/seeds/organizations/marketing_agency/content/documents/greenleaf-gtm-strategy.md`

**Mention targets** (Next Steps section):
- "Finalize influencer shortlist with Priya" → mention
- "Marcus to produce first batch" → mention
- "Elena to set up tracking pixels" → mention

- [ ] **Step 1: Replace name references with mention spans**
- [ ] **Step 2: Commit**

```bash
git add db/seeds/organizations/marketing_agency/content/documents/greenleaf-gtm-strategy.md
git commit -m "Add user mention markup to greenleaf-gtm-strategy seed doc"
```

---

### Task 11: Add mention markup to `greenleaf-q1-campaign-brief.md`

**Files:**
- Modify: `db/seeds/organizations/marketing_agency/content/documents/greenleaf-q1-campaign-brief.md`

**Mention targets:**
- "Lead: James Rivera" → mention
- "Account Manager: Priya Patel" → mention
- Skip names inside the deliverables markdown table (Marcus, Elena, Alex, James)

- [ ] **Step 1: Replace name references with mention spans**
- [ ] **Step 2: Commit**

```bash
git add db/seeds/organizations/marketing_agency/content/documents/greenleaf-q1-campaign-brief.md
git commit -m "Add user mention markup to greenleaf-q1-campaign-brief seed doc"
```

---

### Task 12: Add mention markup to `urbanfit-instagram-campaign.md`

**Files:**
- Modify: `db/seeds/organizations/marketing_agency/content/documents/urbanfit-instagram-campaign.md`

**Mention targets:**
- "Lead: Elena Vasquez" → mention
- "Creative: Marcus Thompson" → mention
- "Elena will compile weekly metrics" → mention
- "deliver a full monthly performance report to Priya" → mention

- [ ] **Step 1: Replace name references with mention spans**
- [ ] **Step 2: Commit**

```bash
git add db/seeds/organizations/marketing_agency/content/documents/urbanfit-instagram-campaign.md
git commit -m "Add user mention markup to urbanfit-instagram-campaign seed doc"
```

---

### Task 13: Add mention markup to `campaign-brainstorm-spring.md`

**Files:**
- Modify: `db/seeds/organizations/marketing_agency/content/documents/campaign-brainstorm-spring.md`

**Mention targets** (Parking Lot section):
- "Elena to research feasibility" → mention
- "Marcus wants to experiment" → mention

- [ ] **Step 1: Replace name references with mention spans**
- [ ] **Step 2: Commit**

```bash
git add db/seeds/organizations/marketing_agency/content/documents/campaign-brainstorm-spring.md
git commit -m "Add user mention markup to campaign-brainstorm-spring seed doc"
```

---

### Task 14: Add mention markup to `technova-proposal-draft.md`

**Files:**
- Modify: `db/seeds/organizations/marketing_agency/content/documents/technova-proposal-draft.md`

**Mention targets:**
- "Prepared by James Rivera" → mention

- [ ] **Step 1: Replace name references with mention spans**
- [ ] **Step 2: Commit**

```bash
git add db/seeds/organizations/marketing_agency/content/documents/technova-proposal-draft.md
git commit -m "Add user mention markup to technova-proposal-draft seed doc"
```

---

### Task 15: End-to-end verification

- [ ] **Step 1: Run all affected tests**

Run: `bin/rspec spec/services/blocknote_blocks_spec.rb spec/services/object_reference_reconciler_spec.rb spec/services/mentions_extractor_spec.rb`
Expected: All pass.

- [ ] **Step 2: Rebuild blocknote-converter** (needed for markdown→blocks conversion)

Run: `cd micro-services/blocknote-converter && npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Reset and re-seed database**

Run: `bin/rails db:seed`
Expected: Seeds complete without errors. Documents are created with user mention blocks containing resolved user NPI IDs (not email addresses).

- [ ] **Step 4: Verify mentions render in the UI**

Start dev server (`bin/dev`), log in, open a document with mentions (e.g., Welcome to BrightPath), confirm mention chips render with user names and are clickable.

- [ ] **Step 5: Final commit (if any fixups needed)**
