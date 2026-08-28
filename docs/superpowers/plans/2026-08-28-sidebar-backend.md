# Sidebar Back-End Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop hauling 14.5 MB of Y.js CRDT blobs out of Postgres to build a JSON tree that needs three columns, delete three full-tree loads that nothing reads, and halve the payload the client must parse.

**Architecture:** Narrow the queries behind the sidebar payload, remove dead loads, omit default-valued fields from the JSON, and memoize `pundit_user`. No behaviour changes — every measurement below is about cost, not output. The one visible-to-client change is that the payload omits fields at their default, so the front-end types become optional with defaults applied at read time.

**Tech Stack:** Rails 8.1, ActiveRecord, Blueprinter, TypeScript/Stimulus, RSpec, Cypress.

**Spec:** This document. Branch is stacked on `sidebar-json-tree` (PR #132), which introduced `SpaceSidebarTree` and the client renderer.

## Measurements this plan is built on

Taken against the dev database's "Główna" space — 1,746 documents, 1,612 hierarchy nodes — and production RDS.

| Fact | Value |
|---|---|
| `sync` bytea in that one space | **14.5 MB** |
| `SELECT documents.*` + has_versions | **172.5ms cold**, 6.6–7.6ms warm |
| Same query narrowed to `id, title, archived` | **5.6ms cold**, 3.2ms warm |
| `SpaceSidebarTree#as_json` | 260ms cold / 41.7ms warm, **1 query** |
| Payload | 193 KB, 122 B/node → **1.17 MB projected at 10k** |
| Payload gzipped | **46 KB** |
| `documents_from_hierarchy` (3 dead call sites) | 135ms cold each |
| `PolicyUserContext.new` | 0.23ms, 1 query each |
| Prod `sync` sizes | p50 **6 KB**, p95 30 KB, max 355 KB |

**Already fixed by PR #132 — do not go looking for it:** the per-document policy N+1 (~6 queries/document) is gone. The sidebar path is now **1 query**, and `policy(@space).update?` costs **0 queries** for a public space.

## Global Constraints

- Ruby strings double-quoted. No indentation whitespace on empty lines.
- Nanoid **string** primary keys — never assume integers.
- Specs use **fixtures, not factories**.
- `bin/` scripts (`bin/rspec`), not `bundle exec`.
- `npm run typecheck` and `npm run lint --max-warnings 0` must pass.
- E2E containers **bake** the app (no source mount) — rebuild before Cypress or you test stale code:
  `SOPS_AGE_KEY_FILE=dockerfiles/sops-age-key.secret bin/dev-e2e up`
  The env prefix is required on this machine; `bin/dev-e2e` otherwise aborts looking for `~/.config/sops/age/keys.txt`.

## Two traps — read before touching anything

1. **`Space#documents_from_hierarchy` must NOT be narrowed globally.**
   `app/controllers/documents_controller.rb:164` does
   `@source_space.documents_from_hierarchy([item_to_move]).each { |document| document.update!(space: @destination_space) }`.
   Partial-select ActiveRecord objects raise `ActiveModel::MissingAttributeError` on save. Narrowing must be **opt-in per call site**.

2. **`documents_from_hierarchy` has a load-bearing side effect.**
   It calls `remove_single_item_from_hierarchy!` for every hierarchy id missing from the DB, mutating `hierarchy` **in memory** so orphaned nodes disappear. `SpaceBlueprint.serialize_hierarchy_node` does `documents_by_id[node["id"]].id` with no nil guard — it would raise on a stale hierarchy node without that cleanup. Any narrowed variant must keep the side effect.

---

### Task 1: Stop selecting the `sync` blob for the sidebar payload

`SpaceSidebarTree` needs `id`, `title` (for emoji splitting), `archived`, and `has_versions`. It currently selects every column, including the `sync` bytea — 14.5 MB in the measured space.

**Files:**
- Modify: `app/services/space_sidebar_tree.rb`
- Test: `spec/services/space_sidebar_tree_spec.rb`

**Interfaces:**
- Produces: unchanged public API — `SpaceSidebarTree.new(space:, can_update_space:).as_json`.

- [ ] **Step 1: Write the failing spec**

Add to `spec/services/space_sidebar_tree_spec.rb`:

```ruby
  it "does not load the sync blob when building the tree" do
    space.update!(hierarchy: [node(one)])

    selected = nil
    ActiveSupport::Notifications.subscribed(->(*, payload) {
      selected = payload[:sql] if payload[:sql].to_s.include?("FROM \"documents\"")
    }, "sql.active_record") do
      described_class.new(space: space, can_update_space: true).as_json
    end

    expect(selected).to be_present
    expect(selected).not_to include("documents\".\"sync")
    expect(selected).not_to match(/SELECT\s+"?documents"?\.\*/)
  end
```

- [ ] **Step 2: Run it and watch it fail**

Run: `bin/rspec spec/services/space_sidebar_tree_spec.rb -e "does not load the sync blob"`
Expected: FAIL — the query still selects `documents.*`.

- [ ] **Step 3: Narrow the select**

In `app/services/space_sidebar_tree.rb`, replace the `documents_by_id` memo:

```ruby
  # Only what the tree renders. Notably NOT `sync`, the Y.js CRDT blob — it is
  # multiple megabytes per space and the sidebar never looks at it.
  SELECTED_COLUMNS = "documents.id, documents.title, documents.archived"

  def documents_by_id
    @documents_by_id ||= @space.documents
      .select("#{SELECTED_COLUMNS}, EXISTS (SELECT 1 FROM versions WHERE versions.document_id = documents.id) AS has_versions")
      .index_by(&:id)
  end
```

`Document#draft?` reads the selected `has_versions` attribute, so it still avoids a per-row query. `title_emoji` / `title_emojiless` operate on `title`, which is selected.

- [ ] **Step 4: Run the whole service spec**

Run: `bin/rspec spec/services/space_sidebar_tree_spec.rb`
Expected: PASS — all examples including the existing emoji, orphan-promotion, and draft-filtering ones.

- [ ] **Step 5: Commit**

```bash
git add app/services/space_sidebar_tree.rb spec/services/space_sidebar_tree_spec.rb
git commit -m "perf(sidebar): stop loading the sync blob when building the tree payload"
```

---

### Task 2: Delete three full-tree loads that nothing reads

`@documents = @space.documents_from_hierarchy` is assigned in three actions and referenced by **no view, component, or spec**. Verified with:
`grep -rn "@documents" app/views app/components spec` → no matches.
Each is a full-tree load: ~135ms cold and the same 14.5 MB of `sync`.

**Files:**
- Modify: `app/controllers/spaces_controller.rb:29` (`#show`)
- Modify: `app/controllers/documents/versions_controller.rb:56` (`#index`) and `:73` (`#show`)
- Test: `spec/requests/spaces_controller_spec.rb`, and the versions request spec if one exists

- [ ] **Step 1: Re-run the gate yourself before deleting**

```bash
grep -rn "@documents" app spec --include=*.rb --include=*.erb
```
Expected: only the three assignments. If anything reads `@documents`, STOP and report.

- [ ] **Step 2: Add a regression spec that the pages still render**

In `spec/requests/spaces_controller_spec.rb`, inside the existing describe with its fixtures and sign-in `before` block:

```ruby
  it "renders a space with no home document without loading the whole tree" do
    space.update!(home_document: nil, hierarchy: [{ "id" => documents(:one).id, "children" => [] }])

    get space_path(space)

    expect(response).to have_http_status(:ok)
  end
```

- [ ] **Step 3: Delete the three assignments**

Remove the `@documents = @space.documents_from_hierarchy` line from each of the three actions. Leave everything else in those actions untouched.

- [ ] **Step 4: Verify**

Run: `bin/rspec spec/requests spec/services`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git commit -am "perf(sidebar): drop three full-tree loads that no view reads"
```

---

### Task 3: Let `SpaceBlueprint` opt into a narrowed query

`SpaceBlueprint.serialize_hierarchy` only reads `id` and `title`, but goes through `documents_from_hierarchy`, which selects everything plus the `has_versions` subquery it never uses. Narrowing must be opt-in (trap 1) and must preserve the orphan-cleanup side effect (trap 2).

**Files:**
- Modify: `app/models/space.rb` (`documents_from_hierarchy`)
- Modify: `app/blueprints/space_blueprint.rb`
- Test: `spec/models/space_spec.rb`, `spec/blueprints/space_blueprint_spec.rb` (create if absent)

**Interfaces:**
- Produces: `Space#documents_from_hierarchy(starting_node = hierarchy, scope: nil)` — `scope` overrides the relation the ids are looked up in; defaults to today's `documents.with_has_versions`.

- [ ] **Step 1: Write the failing specs**

In `spec/models/space_spec.rb`:

```ruby
  describe "#documents_from_hierarchy" do
    fixtures :organizations, :users, :organization_memberships, :spaces, :documents

    let(:space) { spaces(:is_default) }

    it "still removes orphaned hierarchy entries when given a custom scope" do
      space.update!(hierarchy: [
        { "id" => "does-not-exist", "children" => [{ "id" => documents(:one).id, "children" => [] }] }
      ])

      space.documents_from_hierarchy(scope: space.documents.select(:id, :title))

      expect(space.hierarchy.map { _1["id"] }).to eq([documents(:one).id])
    end

    it "uses the given scope for the lookup" do
      space.update!(hierarchy: [{ "id" => documents(:one).id, "children" => [] }])

      result = space.documents_from_hierarchy(scope: space.documents.select(:id, :title))

      expect(result.map(&:id)).to eq([documents(:one).id])
      expect { result.first.archived }.to raise_error(ActiveModel::MissingAttributeError)
    end
  end
```

- [ ] **Step 2: Run and watch them fail**

Run: `bin/rspec spec/models/space_spec.rb -e "documents_from_hierarchy"`
Expected: FAIL — `documents_from_hierarchy` takes no `scope:` keyword.

- [ ] **Step 3: Add the opt-in scope**

In `app/models/space.rb`:

```ruby
  def documents_from_hierarchy(starting_node = hierarchy, scope: nil)
    ids = traverse_hierarchy(starting_node)
    documents_in_db = (scope || self.documents.with_has_versions).where(id: ids)
    (ids - documents_in_db.map(&:id)).each do |missing_id|
      remove_single_item_from_hierarchy!(missing_id)
    end
    documents_in_db
  end
```

Callers that pass no `scope:` are unaffected — including the document-move path, which needs full objects to call `update!`.

- [ ] **Step 4: Use it from the blueprint**

In `app/blueprints/space_blueprint.rb`:

```ruby
  def self.serialize_hierarchy(space)
    # Only id and title are serialised below; skip the sync blob and the
    # has_versions subquery entirely.
    documents_by_id = space
      .documents_from_hierarchy(scope: space.documents.select(:id, :title))
      .index_by(&:id)
    space.hierarchy.map { |node| serialize_hierarchy_node(node, documents_by_id) }
  end
```

- [ ] **Step 5: Verify the API still serialises correctly**

Run: `bin/rspec spec/models/space_spec.rb spec/requests`
Expected: PASS. If a blueprint spec does not exist, add one asserting `SpaceBlueprint.render_as_hash(space, view: :with_documents)` returns the nested `id`/`npi`/`title`/`children` shape for a two-level hierarchy.

- [ ] **Step 6: Commit**

```bash
git commit -am "perf(sidebar): let SpaceBlueprint fetch only the columns it serialises"
```

---

### Task 4: Omit default-valued fields from the payload

The payload is 122 B/node — 1.17 MB projected at 10k documents. Gzip already takes 193 KB to **46 KB**, so this is **not** a bandwidth fix; it halves the JSON the browser must parse and hold.

Measured savings on the 1,612-node space:

| change | size | share |
|---|---|---|
| current | 193 KB | 100% |
| omit empty `children` | 173 KB | 90% |
| + omit nil `emoji` | 152 KB | 79% |
| + omit false `archived`/`draft` | **103 KB** | **54%** |
| + short keys (`i`/`t`/…) | 95 KB | 49% |

**Short keys are deliberately NOT adopted** — 8% more for a payload nobody can read in devtools.

Caveat for honesty: the measured space has **0 emoji titles**, so the `emoji` saving is a best case; an emoji-heavy space saves less.

**Files:**
- Modify: `app/services/space_sidebar_tree.rb`
- Modify: `app/javascript/sidebar/types.ts`
- Modify: `app/javascript/sidebar/tree_item.ts`
- Modify: `app/javascript/stimulus/sidebar_tree_controller.ts`
- Test: `spec/services/space_sidebar_tree_spec.rb`, `spec/e2e/cypress/e2e/spaces/sidebar-tree.cy.js`

- [ ] **Step 1: Write the failing spec**

```ruby
  it "omits fields that are at their default" do
    space.update!(hierarchy: [node(one)])

    payload = described_class.new(space: space, can_update_space: true).as_json
    leaf = payload["nodes"].first

    expect(leaf).not_to have_key("children")
    expect(leaf).not_to have_key("emoji")
    expect(leaf).not_to have_key("archived")
    expect(leaf).to have_key("id")
    expect(leaf).to have_key("title")
  end

  it "still emits fields that are not at their default" do
    one.update!(title: "🔥 Hot", archived: true)
    space.update!(hierarchy: [node(one, [node(two)])])

    leaf = described_class.new(space: space, can_update_space: true).as_json["nodes"].first

    expect(leaf["emoji"]).to eq("🔥")
    expect(leaf["archived"]).to be(true)
    expect(leaf["children"].map { _1["id"] }).to eq([two.id])
  end
```

Note `draft` is `true` for fixture documents (they have no versions), so it will still be emitted there — assert on `archived` and `emoji` for the omission case.

- [ ] **Step 2: Run and watch it fail**

Run: `bin/rspec spec/services/space_sidebar_tree_spec.rb -e "omits fields"`
Expected: FAIL — every key is always present.

- [ ] **Step 3: Omit defaults when building each node**

In `app/services/space_sidebar_tree.rb`, replace the node hash construction:

```ruby
      children = build(node_children)

      node = { "id" => document.id, "title" => title_for(document) }
      node["emoji"] = document.title_emoji if document.title_emoji
      node["archived"] = true if document.archived?
      node["draft"] = true if document.draft?
      node["children"] = children if children.any?
      [node]
```

Keep the existing title logic (plain `||`, no `.presence` — an emoji-only title renders an empty label, matching the pre-rewrite component).

- [ ] **Step 4: Make the client tolerate absent keys**

`app/javascript/sidebar/types.ts` — the four omitted fields become optional:

```ts
export interface TreeNode {
  id: string;
  title: string;
  emoji?: string | null;
  archived?: boolean;
  draft?: boolean;
  children?: TreeNode[];
}
```

Then apply defaults wherever they are read. In `tree_item.ts` and `sidebar_tree_controller.ts`, replace every `node.children` with `(node.children ?? [])`, every `node.archived` with `(node.archived ?? false)`, `node.draft` likewise, and `node.emoji` already tolerates null. Read both files fully and fix **every** site — `renderInto`, `applyTriggerState`, `index`, and the renderer's `hasChildren`. A missed site is a silent rendering bug, not a type error, because `undefined` is falsy.

- [ ] **Step 5: Typecheck, lint, and rebuild for E2E**

```bash
npm run typecheck && npm run lint
SOPS_AGE_KEY_FILE=dockerfiles/sops-age-key.secret bin/dev-e2e up
npx cypress run --project spec/e2e --spec spec/e2e/cypress/e2e/spaces/sidebar-tree.cy.js --config baseUrl=http://localhost:4000
```
Expected: all 13 examples pass. They already cover expansion, nesting, archived visibility and drag-and-drop, so they exercise every field whose presence just became conditional.

- [ ] **Step 6: Commit**

```bash
git commit -am "perf(sidebar): omit default-valued fields from the tree payload"
```

---

### Task 5: Memoize `pundit_user`

`ApplicationController#pundit_user` builds a fresh `PolicyUserContext` on every call, and `PolicyUserContext#initialize` runs `OrganizationMembership.find_by`. Measured at 0.23ms and 1 query per call — **not** a sidebar bottleneck now, but it runs for every policy check in every controller.

**Files:**
- Modify: `app/controllers/application_controller.rb:33-35`
- Test: `spec/requests/spaces_controller_spec.rb`

- [ ] **Step 1: Write the failing spec**

```ruby
  it "builds the policy user context once per request" do
    space.update!(hierarchy: [{ "id" => documents(:one).id, "children" => [] }])

    contexts = 0
    allow(PolicyUserContext).to receive(:new).and_wrap_original do |original, *args|
      contexts += 1
      original.call(*args)
    end

    get sidebar_space_path(space), headers: { "Turbo-Frame" => "space_sidebar" }

    expect(response).to have_http_status(:ok)
    expect(contexts).to eq(1)
  end
```

- [ ] **Step 2: Run and watch it fail**

Run: `bin/rspec spec/requests/spaces_controller_spec.rb -e "policy user context once"`
Expected: FAIL — several contexts built.

- [ ] **Step 3: Memoize**

```ruby
  def pundit_user
    @pundit_user ||= PolicyUserContext.new(current_user, current_organization)
  end
```

**Check first** whether `current_organization` can change within a single request — it is backed by `RequestContext.current_organization`, and `OrganizationsController#select` sets it. If any action changes the organization *after* a policy check, memoizing would serve a stale context; in that case reset `@pundit_user` where the organization is assigned. Read `current_organization=` and its callers before deciding, and record what you found.

- [ ] **Step 4: Verify broadly**

Run: `bin/rspec`
Expected: full suite green — this touches every authorization path, so run everything, not just the sidebar specs.

- [ ] **Step 5: Commit**

```bash
git commit -am "perf: memoize pundit_user so each request builds one policy context"
```

---

### Task 6: Re-measure and record the result

- [ ] **Step 1: Re-run the benchmark**

```bash
bin/rails runner /private/tmp/claude-501/-Users-pawel-Development-Ikigai-Systems-fundamento-cloud/5faa19d2-395c-4bae-8aa8-c439f457f62d/scratchpad/bench_sidebar.rb
```
Record the before/after for query count, `SpaceSidebarTree#as_json` timing, and payload size.

- [ ] **Step 2: Full verification**

```bash
bin/rspec
npm run typecheck && npm run lint
SOPS_AGE_KEY_FILE=dockerfiles/sops-age-key.secret bin/dev-e2e up --test
```
Expected: RSpec green, static checks clean, Cypress 203/203.

- [ ] **Step 3: Commit any notes and stop.**

## Out of scope

- **A flat space still gets no win** — all root nodes always render, so the front-end's reduction depends on the tree having depth. Virtualization would be a separate change.
- **Every toggle rebuilds the whole visible tree** rather than the affected subtree.
- `content-title-updated` carries the emoji in the title, so renaming to "🔥 Notes" shows it as icon and label until the next frame load.
- `updatePlaceholderInterval` is not cleared on `draggable_controller` disconnect.
- The `sync` blob is still loaded on a title `PATCH` (`documents_controller.rb:196`). Median is 6 KB in production, so this is a code smell, not a bottleneck — deliberately not fixed here.
