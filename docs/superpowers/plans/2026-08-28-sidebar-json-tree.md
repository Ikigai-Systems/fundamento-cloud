# Space Sidebar JSON Tree Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop rendering every document in a space into the sidebar DOM; ship the whole tree as JSON in one response and render only the nodes the user can actually see.

**Architecture:** `SpacesController#sidebar` emits the full document tree as JSON in a `<script type="application/json">` tag. A new `sidebar-tree` Stimulus controller owns all item rendering, expansion state (persisted per space in `localStorage`), expand-to-open-document, scroll-into-view, and the archived filter. Collapsing **removes** child nodes from the DOM rather than clipping them with CSS. The existing `draggable` controller keeps working unchanged because Stimulus connects it automatically to each `<ul>` as it is rendered.

**Tech Stack:** Rails 8.1, ViewComponent (being removed from this path), Stimulus 3, TypeScript, Cypress E2E, RSpec.

**Spec:** `/Users/pawel/.claude/plans/we-ve-been-already-discussing-glittery-petal.md` — the investigation that produced this, including the measurements below.

## Why (measured, on production, space "Główna", 1,747 documents)

The sidebar tree was **40,182 of 40,531 page elements — 99.3% of the DOM**, because every node is
rendered server-side and then collapsed client-side. 1,747 items were rendered to display 22.

Simulating this change on the live page:

| | before | after | factor |
|---|---|---|---|
| sidebar elements | 40,243 | 821 | 49× |
| tree items | 1,747 | 33 | 53× |
| html5sortable containers | 3,495 | 67 | 52× |
| keydown (Chrome, user profile) | 10,666ms | 14ms | **762×** |

Confirmed independently in Safari, where the mechanism is different (style/layout, not JS).

## Global Constraints

- Strings in Ruby use **double quotes**. No indentation on empty lines.
- Models use Nanoid string primary keys — never assume integer ids.
- Request specs use **fixtures, not factories** (`.claude/rules/request-specs.md`).
- E2E: never run multiple Cypress specs in parallel against the same DB; `cy.app("clean")` wipes tables (`.claude/rules/e2e-tests.md`).
- `js_from_routes` regenerates `app/javascript/api/*.js` when routes change — commit them. **This plan adds no routes.**
- Run `npm run typecheck` and `npm run lint` before every commit that touches `app/javascript`.
- Every PR carries a changelog entry per `.claude/rules/changelog.md`. Never hand-edit `version.txt`.

## Behaviour that MUST be preserved

1. **Expand-to-open-document** — opening a nested document expands its whole ancestor path.
2. **Scroll-into-view** — the open document is scrolled into view in the sidebar.
3. **Show archived** — the bottom toggle reveals archived items (rarely used, must keep working).
4. **Drag & drop reordering**, including the empty drop-target `<ul>` that allows dropping onto a collapsed node.
5. **Draft filtering** — users who cannot update the space do not see draft documents.

## Deliberate behaviour change (CONFIRMED by Pawel, 2026-08-28)

Collapsing currently animates via `transition-[max-height] duration-150` on
`[data-collapsible-target="content"]`. Because we now **remove** children from the DOM on
collapse, that animation disappears. This is what makes the DOM small; re-adding an animation
would require keeping nodes in the DOM. Expand/collapse becomes instant. **Approved: instant is fine.**

## File Structure

| File | Responsibility |
|---|---|
| `app/services/space_sidebar_tree.rb` (create) | Build the nested tree as plain data from `space.hierarchy` + documents. Pure, no view concerns. |
| `app/controllers/spaces_controller.rb` (modify, `#sidebar`) | Hoist the per-document policy check; expose `@tree`. |
| `app/views/spaces/sidebar.html.erb` (modify) | Emit the JSON payload + an empty mount point instead of the rendered tree. |
| `app/javascript/sidebar/types.ts` (create) | `TreeNode` / `TreePayload` / `RenderContext` types. |
| `app/javascript/sidebar/expansion_store.ts` (create) | Per-space `localStorage` persistence of expanded ids. |
| `app/javascript/sidebar/tree_item.ts` (create) | Build one `<li>`'s markup. Mirrors the old ViewComponent exactly. |
| `app/javascript/stimulus/sidebar_tree_controller.ts` (create) | Owns rendering, expansion, selection, scroll, archived filter. |
| `app/javascript/stimulus/index.js` (modify) | Register `sidebar-tree`. |
| `app/components/space/sidebar_tree_component.*` (delete in Task 8) | Replaced by the client renderer. |
| `app/components/space/sidebar_tree_item_component.*` (delete in Task 8) | Replaced by `tree_item.ts`. |

---

### Task 1: `SpaceSidebarTree` service

Builds the tree as plain data. Two subtleties must be preserved from the current code, and they
differ from each other:

- A hierarchy entry whose document **no longer exists in the DB** currently has its children
  **promoted** into its place (`Space#remove_single_item_from_hierarchy!` splices children in).
- A document filtered out because it is a **draft** currently causes its whole subtree to be
  **dropped** (`SidebarTreeComponent` does `next unless document.present?`).

**Files:**
- Create: `app/services/space_sidebar_tree.rb`
- Test: `spec/services/space_sidebar_tree_spec.rb`

**Interfaces:**
- Produces: `SpaceSidebarTree.new(space:, can_update_space:).as_json` → `{"spaceId" => String, "canUpdateSpace" => Boolean, "nodes" => Array}`; each node is `{"id", "title", "emoji", "archived", "draft", "children"}`.

- [ ] **Step 1: Write the failing spec**

```ruby
require "rails_helper"

RSpec.describe SpaceSidebarTree do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:space) { spaces(:is_default) }
  let(:one) { documents(:one) }
  let(:two) { documents(:two) }

  def node(document, children = [])
    { "id" => document.id, "children" => children }
  end

  it "builds a nested tree of the space's documents" do
    space.update!(hierarchy: [node(one, [node(two)])])

    result = described_class.new(space: space, can_update_space: true).as_json

    expect(result["spaceId"]).to eq(space.id)
    expect(result["canUpdateSpace"]).to be(true)
    expect(result["nodes"].length).to eq(1)
    expect(result["nodes"].first["id"]).to eq(one.id)
    expect(result["nodes"].first["children"].map { _1["id"] }).to eq([two.id])
  end

  it "splits the emoji out of the title" do
    one.update!(title: "🔥 Hot Topic")
    space.update!(hierarchy: [node(one)])

    result = described_class.new(space: space, can_update_space: true).as_json

    expect(result["nodes"].first["title"]).to eq("Hot Topic")
    expect(result["nodes"].first["emoji"]).to eq("🔥")
  end

  it "promotes children of a hierarchy entry whose document no longer exists" do
    space.update!(hierarchy: [{ "id" => "does-not-exist", "children" => [node(two)] }])

    result = described_class.new(space: space, can_update_space: true).as_json

    expect(result["nodes"].map { _1["id"] }).to eq([two.id])
  end

  it "drops a draft document and its whole subtree when the user cannot update the space" do
    space.update!(hierarchy: [node(one, [node(two)])])

    result = described_class.new(space: space, can_update_space: false).as_json

    expect(result["nodes"]).to eq([])
  end

  it "keeps draft documents when the user can update the space" do
    space.update!(hierarchy: [node(one)])

    result = described_class.new(space: space, can_update_space: true).as_json

    expect(result["nodes"].first["draft"]).to be(true)
  end

  it "marks archived documents" do
    one.update!(archived: true)
    space.update!(hierarchy: [node(one)])

    result = described_class.new(space: space, can_update_space: true).as_json

    expect(result["nodes"].first["archived"]).to be(true)
  end
end
```

Note: fixture documents have no `versions`, so `draft?` is `true` for both — that is what the
draft-filtering examples rely on.

- [ ] **Step 2: Run it and watch it fail**

Run: `bin/rspec spec/services/space_sidebar_tree_spec.rb`
Expected: FAIL — `uninitialized constant SpaceSidebarTree`

- [ ] **Step 3: Implement the service**

```ruby
# frozen_string_literal: true

# Builds the space sidebar document tree as plain data.
#
# The whole tree ships to the browser in one response and the front-end renders only the nodes
# it needs, so this must stay cheap and must not render any markup.
class SpaceSidebarTree
  def initialize(space:, can_update_space:)
    @space = space
    @can_update_space = can_update_space
  end

  def as_json
    {
      "spaceId" => @space.id,
      "canUpdateSpace" => @can_update_space,
      "nodes" => build(@space.hierarchy),
    }
  end

  private

  def documents_by_id
    @documents_by_id ||= @space.documents.with_has_versions.index_by(&:id)
  end

  def build(nodes)
    Array(nodes).flat_map do |node|
      children = node["children"] || []
      document = documents_by_id[node["id"]]

      # Orphaned hierarchy entry: promote its children, matching the splice that
      # Space#remove_single_item_from_hierarchy! used to perform in memory.
      next build(children) if document.nil?

      # Drafts are invisible to anyone who cannot update the space, and so is their subtree.
      next [] if document.draft? && !@can_update_space

      [{
        "id" => document.id,
        "title" => document.title_emojiless.presence || document.title,
        "emoji" => document.title_emoji,
        "archived" => document.archived?,
        "draft" => document.draft?,
        "children" => build(children),
      }]
    end
  end
end
```

- [ ] **Step 4: Run the spec and watch it pass**

Run: `bin/rspec spec/services/space_sidebar_tree_spec.rb`
Expected: PASS (6 examples)

- [ ] **Step 5: Commit**

```bash
git add app/services/space_sidebar_tree.rb spec/services/space_sidebar_tree_spec.rb
git commit -m "feat(sidebar): add SpaceSidebarTree to build the tree as plain data"
```

---

### Task 2: Controller and view emit JSON instead of rendered markup

`policy(document).update?` is called **per document** today. `DocumentPolicy#update?` delegates
entirely to `SpacePolicy#update?` on `record.space`, and every sidebar document belongs to
`@space` — so one call is exactly equivalent and removes an N+1 from the path we are rewriting.

**Files:**
- Modify: `app/controllers/spaces_controller.rb:163-169`
- Modify: `app/views/spaces/sidebar.html.erb:43-55`
- Test: `spec/requests/spaces_controller_spec.rb`

**Interfaces:**
- Consumes: `SpaceSidebarTree` from Task 1.
- Produces: a `<script type="application/json" data-sidebar-tree-target="data">` element inside `[data-controller="sidebar-tree"]`, and an empty `ul.section-content-list[data-sidebar-tree-target="root"]`.

- [ ] **Step 1: Write the failing request spec**

Add to `spec/requests/spaces_controller_spec.rb`:

```ruby
describe "GET #sidebar" do
  fixtures :organizations, :users, :organization_memberships, :spaces, :documents

  let(:user) { users(:pawel) }
  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }

  before do
    sign_in user
    post select_organization_path(organization)
    space.update!(hierarchy: [{ "id" => documents(:one).id, "children" => [] }])
  end

  it "ships the tree as JSON rather than rendered tree items" do
    get sidebar_space_path(space), headers: { "Turbo-Frame" => "space_sidebar" }

    expect(response).to have_http_status(:ok)
    expect(response.body).to include("data-sidebar-tree-target=\"data\"")
    expect(response.body).not_to include("section-content-node-container")

    json = Nokogiri::HTML(response.body).at("script[data-sidebar-tree-target='data']").text
    payload = JSON.parse(json)
    expect(payload["nodes"].map { _1["id"] }).to eq([documents(:one).id])
    expect(payload["canUpdateSpace"]).to be(true)
  end
end
```

- [ ] **Step 2: Run it and watch it fail**

Run: `bin/rspec spec/requests/spaces_controller_spec.rb -e "ships the tree as JSON"`
Expected: FAIL — the body still contains `section-content-node-container`.

- [ ] **Step 3: Replace the controller action body**

In `app/controllers/spaces_controller.rb`, replace the `sidebar` action:

```ruby
  def sidebar
    authorize @space, :show?

    # DocumentPolicy#update? delegates to SpacePolicy#update? on the document's space, and every
    # document here belongs to @space — so this is the same answer for all of them, computed once.
    @can_update_space = policy(@space).update?
    @tree = SpaceSidebarTree.new(space: @space, can_update_space: @can_update_space).as_json
    @tables = policy_scope(@space.tables.lexicographically, policy_scope_class: DocumentPolicy::Scope)
  end
```

- [ ] **Step 4: Replace the tree render in the view**

In `app/views/spaces/sidebar.html.erb`, replace the whole `div.section-content-container` that
currently renders `Space::SidebarTreeComponent` with:

```erb
        <div class="section-content-container"
          data-controller="sidebar-tree"
          data-sidebar-tree-space-id-value="<%= @space.id %>"
          data-sidebar-tree-selected-id-value="<%= params.dig(:object, :id) %>"
          data-sidebar-tree-selected-type-value="<%= params.dig(:object, :type) %>"
          data-sidebar-tree-can-update-space-value="<%= @can_update_space %>"
        >
          <div class="section-empty hidden">No documents in this space</div>

          <%= tag.script json_escape(@tree.to_json).html_safe,
            type: "application/json",
            data: { "sidebar-tree-target" => "data" } %>

          <ul class="section-content-list"
            data-sidebar-tree-target="root"
            data-controller="draggable"
            data-space-id="<%= @space.id %>"></ul>
        </div>
```

`json_escape` escapes `<`, `>` and `&` so a document title can never break out of the script tag.

- [ ] **Step 5: Run the request spec and watch it pass**

Run: `bin/rspec spec/requests/spaces_controller_spec.rb`
Expected: PASS. The sidebar now renders no tree items at all — the tree is empty in the browser
until Task 3 lands. That is expected and is why Tasks 2 and 3 land together in one PR.

- [ ] **Step 6: Commit**

```bash
git add app/controllers/spaces_controller.rb app/views/spaces/sidebar.html.erb spec/requests/spaces_controller_spec.rb
git commit -m "feat(sidebar): ship the document tree as JSON and hoist the per-document policy check"
```

---

### Task 3: Client renderer — types, item markup, and the Stimulus controller

**Files:**
- Create: `app/javascript/sidebar/types.ts`
- Create: `app/javascript/sidebar/expansion_store.ts`
- Create: `app/javascript/sidebar/tree_item.ts`
- Create: `app/javascript/stimulus/sidebar_tree_controller.ts`
- Modify: `app/javascript/stimulus/index.js`
- Test: `spec/e2e/cypress/e2e/spaces/sidebar-tree.cy.js`

**Interfaces:**
- Consumes: the JSON payload from Task 2.
- Produces: `renderTreeItem(node, ctx, level): HTMLLIElement`; `loadExpanded(spaceId): Set<string>`; `saveExpanded(spaceId, ids): void`.

- [ ] **Step 1: Write the types**

`app/javascript/sidebar/types.ts`:

```ts
export interface TreeNode {
  id: string;
  title: string;
  emoji: string | null;
  archived: boolean;
  draft: boolean;
  children: TreeNode[];
}

export interface TreePayload {
  spaceId: string;
  canUpdateSpace: boolean;
  nodes: TreeNode[];
}

export interface RenderContext {
  spaceId: string;
  canUpdateSpace: boolean;
  selectedId: string | null;
  csrfToken: string;
}
```

- [ ] **Step 2: Write the expansion store**

`app/javascript/sidebar/expansion_store.ts`:

```ts
const storageKey = (spaceId: string): string => `fundamento:sidebar:expanded:${spaceId}`;

export function loadExpanded(spaceId: string): Set<string> {
  try {
    const raw = window.localStorage.getItem(storageKey(spaceId));
    if (!raw) return new Set<string>();
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set<string>(parsed as string[]) : new Set<string>();
  } catch {
    // Private mode, disabled storage, or corrupt value — expansion is not worth failing over.
    return new Set<string>();
  }
}

export function saveExpanded(spaceId: string, ids: Set<string>): void {
  try {
    window.localStorage.setItem(storageKey(spaceId), JSON.stringify([...ids]));
  } catch {
    // Quota or private mode — ignore.
  }
}
```

- [ ] **Step 3: Write the item renderer**

`app/javascript/sidebar/tree_item.ts` — this must mirror
`app/components/space/sidebar_tree_item_component.html.erb` and the two `<ul>`s from
`sidebar_tree_component.html.erb`, including the **empty** drop-target `<ul>` (the template
comments it as "a hack to make it possible to drop items onto a collapsed section").

```ts
import {RenderContext, TreeNode} from "./types";

function escapeHtml(value: string): string {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function iconHtml(node: TreeNode): string {
  return node.emoji ? escapeHtml(node.emoji) : `<i class="fa-regular fa-file-lines"></i>`;
}

function actionsHtml(node: TreeNode, ctx: RenderContext, selected: boolean): string {
  if (!ctx.canUpdateSpace) return "";
  const selectedClass = selected ? " selected" : "";

  // Mirrors button_to: a real form POST with data-turbo="false" so the page fully reloads.
  return `
    <form class="flex items-center" method="post" action="/d" data-turbo="false">
      <input type="hidden" name="authenticity_token" value="${escapeHtml(ctx.csrfToken)}">
      <input type="hidden" name="space_id" value="${escapeHtml(ctx.spaceId)}">
      <input type="hidden" name="document[title]" value="">
      <input type="hidden" name="parent_type" value="Document">
      <input type="hidden" name="parent_id" value="${escapeHtml(node.id)}">
      <button type="submit" class="content-link-button${selectedClass}"><i class="fa-regular fa-plus"></i></button>
    </form>
    <a class="content-link-button${selectedClass}" href="/d/${encodeURIComponent(node.id)}/edit" data-turbo-frame="content"><i class="fa-regular fa-pencil"></i></a>
  `;
}

export function renderTreeItem(node: TreeNode, ctx: RenderContext, level: number): HTMLLIElement {
  const selected = ctx.selectedId === node.id;
  const hasChildren = node.children.length > 0;

  const li = document.createElement("li");
  li.className = "section-content-node-container";
  li.dataset.nodeId = node.id;
  li.dataset.level = String(level);
  if (hasChildren) li.dataset.hasChildren = "true";

  const containerClasses = ["content-link-container", "group"];
  if (node.archived) containerClasses.push("archived");
  if (selected) containerClasses.push("selected");

  li.innerHTML = `
    <div class="${containerClasses.join(" ")}"${node.archived ? ` data-visibility-target="hideable"` : ""}>
      <a class="content-link" href="/d/${encodeURIComponent(node.id)}" data-turbo-frame="content">
        <div class="document-padding-left flex items-center w-full" style="--level: ${level}">
          <button type="button" class="collapsible-trigger flex items-center justify-center"
                  data-action="click->sidebar-tree#toggle:prevent" data-node-id="${escapeHtml(node.id)}">
            <div class="collapsible-icon icon-[heroicons--chevron-right-16-solid] size-4"></div>
            <div class="collapsible-dot">•</div>
          </button>
          <div data-document-id="${escapeHtml(node.id)}" class="flex flex-grow min-w-0 gap-1 mx-0 p-2 items-center">
            ${iconHtml(node)}
            <span class="truncate">${escapeHtml(node.title)}</span>
            ${node.draft ? `<span class="draft-lozenge">Draft</span>` : ""}
          </div>
        </div>
      </a>
      <div class="content-link-buttons-container">${actionsHtml(node, ctx, selected)}</div>
    </div>
    <ul data-controller="draggable" data-space-id="${escapeHtml(ctx.spaceId)}" data-document-id="${escapeHtml(node.id)}"></ul>
    <ul data-controller="draggable" data-sidebar-tree-children="true" data-space-id="${escapeHtml(ctx.spaceId)}" data-document-id="${escapeHtml(node.id)}"></ul>
  `;

  return li;
}
```

- [ ] **Step 4: Write the Stimulus controller**

`app/javascript/stimulus/sidebar_tree_controller.ts`:

```ts
import {Controller} from "@hotwired/stimulus"
import {loadExpanded, saveExpanded} from "../sidebar/expansion_store"
import {renderTreeItem} from "../sidebar/tree_item"
import {RenderContext, TreeNode, TreePayload} from "../sidebar/types"

// Connects to data-controller="sidebar-tree"
export default class extends Controller<HTMLElement> {
  static targets = ["data", "root"];
  static values = {
    spaceId: String,
    selectedId: String,
    selectedType: String,
    canUpdateSpace: Boolean,
  };

  declare dataTarget: HTMLScriptElement;
  declare rootTarget: HTMLElement;
  declare spaceIdValue: string;
  declare selectedIdValue: string;
  declare selectedTypeValue: string;
  declare canUpdateSpaceValue: boolean;

  private payload!: TreePayload;
  private expanded!: Set<string>;
  private byId = new Map<string, TreeNode>();

  connect() {
    this.payload = JSON.parse(this.dataTarget.textContent || "{}") as TreePayload;
    this.payload.nodes ||= [];
    this.index(this.payload.nodes);
    this.expanded = loadExpanded(this.spaceIdValue);
    this.expandAncestorsOfSelected();
    this.render();
    this.scrollSelectedIntoView();
  }

  toggle(event: Event) {
    const trigger = event.currentTarget as HTMLElement;
    const id = trigger.dataset.nodeId;
    if (!id) return;

    const node = this.byId.get(id);
    if (!node || node.children.length === 0) return;

    if (this.expanded.has(id)) {
      this.expanded.delete(id);
    } else {
      this.expanded.add(id);
    }
    saveExpanded(this.spaceIdValue, this.expanded);
    this.render();
  }

  private index(nodes: TreeNode[], parentId: string | null = null) {
    for (const node of nodes) {
      this.byId.set(node.id, node);
      this.parentOf.set(node.id, parentId);
      this.index(node.children, node.id);
    }
  }

  private parentOf = new Map<string, string | null>();

  private expandAncestorsOfSelected() {
    if (this.selectedTypeValue !== "Document" || !this.selectedIdValue) return;
    let parent = this.parentOf.get(this.selectedIdValue) ?? null;
    while (parent) {
      this.expanded.add(parent);
      parent = this.parentOf.get(parent) ?? null;
    }
  }

  private get context(): RenderContext {
    return {
      spaceId: this.spaceIdValue,
      canUpdateSpace: this.canUpdateSpaceValue,
      selectedId: this.selectedIdValue || null,
      csrfToken: document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? "",
    };
  }

  private render() {
    this.rootTarget.replaceChildren();
    this.renderInto(this.rootTarget, this.payload.nodes, 0);
    this.updateEmptyState();
  }

  private renderInto(container: HTMLElement, nodes: TreeNode[], level: number) {
    const ctx = this.context;
    for (const node of nodes) {
      const li = renderTreeItem(node, ctx, level);
      this.applyTriggerState(li, node);
      container.appendChild(li);

      if (node.children.length > 0 && this.expanded.has(node.id)) {
        const childContainer = li.querySelector<HTMLElement>('ul[data-sidebar-tree-children="true"]');
        if (childContainer) this.renderInto(childContainer, node.children, level + 1);
      }
    }
  }

  private applyTriggerState(li: HTMLElement, node: TreeNode) {
    const trigger = li.querySelector<HTMLElement>(".collapsible-trigger");
    if (!trigger) return;

    if (node.children.length === 0) {
      trigger.classList.add("is-leaf");
    } else if (this.expanded.has(node.id)) {
      trigger.classList.add("is-expanded");
    } else {
      trigger.classList.add("is-collapsed");
    }
  }

  private updateEmptyState() {
    const empty = this.element.querySelector<HTMLElement>(".section-empty");
    if (empty) empty.classList.toggle("hidden", this.payload.nodes.length > 0);
  }

  private scrollSelectedIntoView() {
    if (!this.selectedIdValue) return;
    const selected = this.rootTarget.querySelector<HTMLElement>(
      `li[data-node-id="${CSS.escape(this.selectedIdValue)}"] .content-link-container.selected`
    );
    if (!selected) return;
    requestAnimationFrame(() => selected.scrollIntoView({behavior: "instant"}));
  }
}
```

- [ ] **Step 5: Register the controller**

In `app/javascript/stimulus/index.js`, add the import alongside the others and register it with
the same style already used in that file:

```js
import SidebarTreeController from "./sidebar_tree_controller.ts";
// ...
application.register("sidebar-tree", SidebarTreeController);
```

- [ ] **Step 6: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: both clean.

- [ ] **Step 7: Write the E2E spec for rendering and expansion**

`spec/e2e/cypress/e2e/spaces/sidebar-tree.cy.js`:

```js
import {isOrganizationCookie} from "../../support/organization-cookies.js";

describe("Space sidebar tree", function () {
  beforeEach(() => {
    cy.app("clean");
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: ["organizations", "users", "organization_memberships", "spaces", "documents"],
    });
    // Nest "two" under "one" so we can test expansion.
    cy.appEval(`
      space = Space.find("is_default")
      space.update!(hierarchy: [{ "id" => "one", "children" => [{ "id" => "two", "children" => [] }] }])
    `);
    cy.loginWithSession("pawel@ikigai.systems", "password");
    cy.setCookie("organization_id", isOrganizationCookie);
  });

  it("renders only root nodes until a node is expanded", function () {
    cy.visit("/d/one");

    cy.get("#space-sidebar li[data-node-id='one']").should("exist");
    cy.get("#space-sidebar li[data-node-id='two']").should("not.exist");

    cy.get("#space-sidebar li[data-node-id='one'] .collapsible-trigger").click();

    cy.get("#space-sidebar li[data-node-id='two']").should("exist");
  });

  it("removes children from the DOM again when collapsed", function () {
    cy.visit("/d/one");

    cy.get("#space-sidebar li[data-node-id='one'] .collapsible-trigger").click();
    cy.get("#space-sidebar li[data-node-id='two']").should("exist");

    cy.get("#space-sidebar li[data-node-id='one'] .collapsible-trigger").first().click();
    cy.get("#space-sidebar li[data-node-id='two']").should("not.exist");
  });

  it("does not render the whole tree into the DOM", function () {
    cy.visit("/d/one");

    cy.get("#space-sidebar li[data-node-id='one']").should("exist");
    cy.get("#space-sidebar li.section-content-node-container").should("have.length", 1);
  });
});
```

- [ ] **Step 8: Run the E2E spec**

Run: `npx cypress run --project spec/e2e --spec spec/e2e/cypress/e2e/spaces/sidebar-tree.cy.js --config baseUrl=http://localhost:4000`
Expected: 3 passing. (Environment must be up: `bin/dev-e2e up --no-build`.)

- [ ] **Step 9: Commit**

```bash
git add app/javascript/sidebar app/javascript/stimulus/sidebar_tree_controller.ts app/javascript/stimulus/index.js spec/e2e/cypress/e2e/spaces/sidebar-tree.cy.js
git commit -m "feat(sidebar): render the document tree on the client from JSON"
```

---

### Task 4: Persist expansion state across reloads

**Files:**
- Test: `spec/e2e/cypress/e2e/spaces/sidebar-tree.cy.js` (add)

The implementation already landed in Task 3 (`expansion_store.ts`); this task proves it and
pins the behaviour.

- [ ] **Step 1: Add the failing-if-broken E2E examples**

```js
  it("remembers which nodes are expanded across a reload", function () {
    cy.visit("/d/one");

    cy.get("#space-sidebar li[data-node-id='one'] .collapsible-trigger").click();
    cy.get("#space-sidebar li[data-node-id='two']").should("exist");

    cy.reload();

    cy.get("#space-sidebar li[data-node-id='two']").should("exist");
  });

  it("remembers a collapse across a reload", function () {
    cy.visit("/d/one");

    cy.get("#space-sidebar li[data-node-id='one'] .collapsible-trigger").click();
    cy.get("#space-sidebar li[data-node-id='two']").should("exist");
    cy.get("#space-sidebar li[data-node-id='one'] .collapsible-trigger").first().click();

    cy.reload();

    cy.get("#space-sidebar li[data-node-id='two']").should("not.exist");
  });

  it("keeps expansion state separate per space", function () {
    cy.visit("/d/one");
    cy.get("#space-sidebar li[data-node-id='one'] .collapsible-trigger").click();

    cy.window().then((win) => {
      expect(win.localStorage.getItem("fundamento:sidebar:expanded:is_default")).to.contain("one");
      expect(win.localStorage.getItem("fundamento:sidebar:expanded:hc_default")).to.equal(null);
    });
  });
```

- [ ] **Step 2: Run and confirm they pass**

Run: `npx cypress run --project spec/e2e --spec spec/e2e/cypress/e2e/spaces/sidebar-tree.cy.js --config baseUrl=http://localhost:4000`
Expected: 6 passing.

- [ ] **Step 3: Commit**

```bash
git add spec/e2e/cypress/e2e/spaces/sidebar-tree.cy.js
git commit -m "test(sidebar): cover per-space expansion persistence"
```

---

### Task 5: Expand to the open document and scroll it into view

**Files:**
- Test: `spec/e2e/cypress/e2e/spaces/sidebar-tree.cy.js` (add)

Implementation landed in Task 3 (`expandAncestorsOfSelected`, `scrollSelectedIntoView`).

- [ ] **Step 1: Add the E2E examples**

```js
  it("expands the ancestor path of the open document", function () {
    cy.visit("/d/two");

    // "two" is nested under "one" and must be revealed without any interaction.
    cy.get("#space-sidebar li[data-node-id='two']").should("exist");
    cy.get("#space-sidebar li[data-node-id='two'] .content-link-container")
      .should("have.class", "selected");
  });

  it("scrolls the open document into view", function () {
    cy.visit("/d/two");

    cy.get("#space-sidebar li[data-node-id='two'] .content-link-container.selected")
      .should("be.visible");
  });

  it("expands to the open document even when the stored state has it collapsed", function () {
    cy.visit("/d/one");
    cy.get("#space-sidebar li[data-node-id='one'] .collapsible-trigger").click();
    cy.get("#space-sidebar li[data-node-id='one'] .collapsible-trigger").first().click();

    cy.visit("/d/two");

    cy.get("#space-sidebar li[data-node-id='two']").should("exist");
  });
```

- [ ] **Step 2: Run and confirm**

Run: `npx cypress run --project spec/e2e --spec spec/e2e/cypress/e2e/spaces/sidebar-tree.cy.js --config baseUrl=http://localhost:4000`
Expected: 9 passing.

- [ ] **Step 3: Commit**

```bash
git add spec/e2e/cypress/e2e/spaces/sidebar-tree.cy.js
git commit -m "test(sidebar): cover expand-to-open-document and scroll-into-view"
```

---

### Task 6: Show-archived toggle keeps working

Archived items render with `data-visibility-target="hideable"` and the `visibility` controller
sets `element.hidden`. Because the tree now re-renders, newly rendered archived nodes must pick
up the current toggle state rather than defaulting to visible.

**Files:**
- Modify: `app/javascript/stimulus/sidebar_tree_controller.ts`
- Test: `spec/e2e/cypress/e2e/spaces/sidebar-tree.cy.js` (add)

- [ ] **Step 1: Add the failing E2E example**

```js
  it("keeps archived documents hidden until the toggle is switched on", function () {
    cy.appEval(`Document.find("two").update!(archived: true)`);
    cy.visit("/d/one");

    cy.get("#space-sidebar li[data-node-id='one'] .collapsible-trigger").click();
    cy.get("#space-sidebar li[data-node-id='two'] .content-link-container")
      .should("not.be.visible");

    cy.contains("Show archived").parent().find("[data-toggle-button-target='input'], input").click({force: true});

    cy.get("#space-sidebar li[data-node-id='two'] .content-link-container")
      .should("be.visible");
  });
```

- [ ] **Step 2: Run it and watch it fail**

Expected: FAIL — a freshly rendered archived node is visible even while the toggle is off.

- [ ] **Step 3: Apply the current archived state on render**

Add to `sidebar_tree_controller.ts`. Read the same cookie the server used to read, and re-apply
after every render:

```ts
  private get showArchived(): boolean {
    return document.cookie.split("; ").some(c => c === "ikigai_userPreferences_showArchived=true");
  }

  private applyArchivedVisibility() {
    this.rootTarget.querySelectorAll<HTMLElement>('[data-visibility-target="hideable"]')
      .forEach(el => { el.hidden = !this.showArchived; });
  }
```

Call `this.applyArchivedVisibility()` at the end of `render()`, after `updateEmptyState()`.

- [ ] **Step 4: Run the spec and watch it pass**

Run: `npx cypress run --project spec/e2e --spec spec/e2e/cypress/e2e/spaces/sidebar-tree.cy.js --config baseUrl=http://localhost:4000`
Expected: 10 passing.

- [ ] **Step 5: Commit**

```bash
git add app/javascript/stimulus/sidebar_tree_controller.ts spec/e2e/cypress/e2e/spaces/sidebar-tree.cy.js
git commit -m "fix(sidebar): apply the show-archived toggle to newly rendered nodes"
```

---

### Task 7: Drag & drop still reorders and persists

`draggable` connects automatically to each rendered `<ul>`, so this should work — but the
reorder POST reads `data-space-id` and `data-document-id` off elements this plan now generates
in TypeScript, so it must be proven end to end.

**Files:**
- Test: `spec/e2e/cypress/e2e/spaces/sidebar-tree.cy.js` (add)
- Modify: `app/javascript/stimulus/sidebar_tree_controller.ts` (only if the test fails)

- [ ] **Step 1: Add the E2E example**

```js
  it("still persists a reorder via drag and drop", function () {
    cy.appEval(`
      space = Space.find("is_default")
      space.update!(hierarchy: [
        { "id" => "one", "children" => [] },
        { "id" => "two", "children" => [] }
      ])
    `);
    cy.visit("/d/one");

    cy.intercept("PUT", /\\/s\\/.*\\/reorder_hierarchy/).as("reorder");

    cy.get("#space-sidebar li[data-node-id='two']").trigger("dragstart");
    cy.get("#space-sidebar li[data-node-id='one']").trigger("dragover").trigger("drop");

    cy.wait("@reorder").its("response.statusCode").should("be.oneOf", [200, 204]);
  });
```

- [ ] **Step 2: Run it**

Run: `npx cypress run --project spec/e2e --spec spec/e2e/cypress/e2e/spaces/sidebar-tree.cy.js --config baseUrl=http://localhost:4000`

If html5sortable does not respond to synthetic drag events in Cypress, replace this example with
a direct assertion that the rendered containers carry the attributes `draggable_controller`
needs, and verify drag manually in the browser:

```js
  it("gives every rendered container the data the draggable controller needs", function () {
    cy.visit("/d/one");

    cy.get("#space-sidebar li[data-node-id='one'] ul[data-controller='draggable']")
      .should("have.length", 2)
      .each(($ul) => {
        cy.wrap($ul).should("have.attr", "data-space-id", "is_default");
        cy.wrap($ul).should("have.attr", "data-document-id", "one");
      });
  });
```

- [ ] **Step 3: Commit**

```bash
git add spec/e2e/cypress/e2e/spaces/sidebar-tree.cy.js
git commit -m "test(sidebar): cover drag-and-drop wiring on client-rendered nodes"
```

---

### Task 8: Delete the dead ViewComponents and verify the win

**Files:**
- Delete: `app/components/space/sidebar_tree_component.rb`, `app/components/space/sidebar_tree_component.html.erb`
- Delete: `app/components/space/sidebar_tree_item_component.rb`, `app/components/space/sidebar_tree_item_component.html.erb`
- Delete: any specs for the above under `spec/components/`

- [ ] **Step 1: Confirm nothing references them**

Run: `grep -rn "SidebarTreeComponent\|SidebarTreeItemComponent" app spec --include=*.rb --include=*.erb`
Expected: no matches outside the files being deleted.

- [ ] **Step 2: Delete them**

```bash
git rm app/components/space/sidebar_tree_component.rb app/components/space/sidebar_tree_component.html.erb
git rm app/components/space/sidebar_tree_item_component.rb app/components/space/sidebar_tree_item_component.html.erb
```

- [ ] **Step 3: Run the full relevant suites**

```bash
bin/rspec spec/services/space_sidebar_tree_spec.rb spec/requests/spaces_controller_spec.rb
npm run typecheck && npm run lint
bin/dev-e2e up --test
```
Expected: all green. Watch specifically for `frame-navigation.cy.js` and
`frame-navigation-full-width.cy.js`, which assert on `#space-sidebar a.content-link[href='/d/two']`
— that selector must still match client-rendered nodes, and `two` must be revealed (it is a root
node in those fixtures, because `activerecord_fixtures.rb` rebuilds a flat hierarchy).

- [ ] **Step 4: Measure the result in a real browser**

With a large space loaded, in the console:

```js
({elements: document.getElementsByTagName("*").length,
  sidebar: document.querySelectorAll("#space-sidebar *").length,
  items: document.querySelectorAll("#space-sidebar li.section-content-node-container").length,
  draggables: document.querySelectorAll("[data-controller~='draggable']").length})
```

Expected on a 1,747-document space: sidebar elements in the high hundreds, not ~40,000.

- [ ] **Step 5: Commit**

```bash
git commit -m "refactor(sidebar): remove the server-rendered tree components"
```

---

## Follow-up (next phase, same session)

Back-end pass, tracked separately: `SpacesController#sidebar` still loads every document in the
space to build the JSON. At 10k documents the remaining costs are the `with_has_versions`
correlated `EXISTS` per row and `pundit_user` rebuilding `PolicyUserContext` (and re-querying
`OrganizationMembership`) on every call. Task 2 removes the per-document policy call; the rest
belongs to the back-end phase.

---

## Risks and things to watch during execution

1. **`sidebar_active_controller.ts` interaction.** It rewrites `.content-link-container` selection
   state on every `turbo:frame-load`, because clicking a sidebar link swaps only the content
   frame and does not re-render the sidebar. Our renderer also sets `selected` at render time
   from `selectedIdValue`. Both must agree on the same selector (`.content-link-container` and
   the `selected` class). `frame-navigation.cy.js` asserts exactly this — treat a failure there
   as a real regression, not a flaky test.

2. **`content_title_sync_controller.ts` depends on our markup.** It patches the sidebar label in
   place with `querySelector('[data-document-id="ID"] span.truncate')`. `tree_item.ts` must keep
   both the `data-document-id` attribute and the `span.truncate` element, or renaming a document
   silently stops updating the sidebar. `editable-content-title.cy.js` covers this.

3. **The `--level` CSS custom property drives indentation.** `document-padding-left` reads
   `--level`; `draggable_controller.ts` also recomputes it after a drop by walking
   `.document-padding-left` elements. Keep the property name and the class.

4. **The empty drop-target `<ul>`.** Removing it will silently break dropping onto a collapsed
   node. It is the first of the two `<ul>`s and must stay empty.

5. **Payload size.** 105KB of JSON at 1,747 documents, ~600KB projected at 10k. If that becomes a
   problem before the 10k target is reached, the next step is omitting `children: []` for leaves
   and shortening keys — not going back to server-side rendering.

6. **`json_escape` is load-bearing.** Document titles are user input rendered inside a `<script>`
   tag. `json_escape` escapes `<`, `>` and `&` so a title containing `</script>` cannot break out.
   Do not replace it with a bare `to_json`.
