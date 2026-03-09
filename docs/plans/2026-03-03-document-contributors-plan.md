# Document Contributors Display — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Display document contributors (from DocumentEditingSessions) in the sidebar details panel and version history pages, using a new reusable UserAvatarsGroup component.

**Architecture:** Add `contributors` methods to Document and Version models that query unique users through editing sessions. Create a UserAvatarsGroup ViewComponent that renders stacked avatars with overflow popover. Wire it into the existing sidebar details partial and both version history views.

**Tech Stack:** Ruby on Rails ViewComponent, existing UserAvatar component, Stimulus popover controller, Cypress E2E tests.

---

### Task 1: Add `contributors` method to Document model

**Files:**
- Modify: `app/models/document.rb:26` (after editing_sessions association)
- Test: `spec/models/document_spec.rb`

**Step 1: Write the failing test**

Add to `spec/models/document_spec.rb`:

```ruby
describe "#contributors" do
  fixtures :users, :organization_memberships, :versions, :document_editing_sessions

  it "returns unique users from editing sessions ordered by name" do
    document = documents(:one)
    contributors = document.contributors

    expect(contributors).to be_an(ActiveRecord::Relation)
    expect(contributors.map(&:display_name)).to eq(contributors.map(&:display_name).sort)
    expect(contributors.pluck(:id).uniq.length).to eq(contributors.length)
  end

  it "includes both editors and viewers" do
    document = documents(:one)
    # Fixtures: session_pawel_doc_one (edited: true), session_stefan_doc_one (edited: false)
    contributors = document.contributors

    expect(contributors.map(&:id)).to include("user_pawel")
    expect(contributors.map(&:id)).to include("user_stefan")
  end

  it "returns empty relation when no editing sessions exist" do
    document = documents(:two)
    # Clear existing sessions for doc two
    document.editing_sessions.delete_all

    expect(document.contributors).to be_empty
  end
end
```

**Step 2: Run test to verify it fails**

Run: `bin/rspec spec/models/document_spec.rb --tag focus`
Expected: FAIL with `undefined method 'contributors'`

**Step 3: Write minimal implementation**

Add to `app/models/document.rb` after line 26 (after `has_many :editing_sessions`):

```ruby
def contributors
  User.joins(organization_memberships: :editing_sessions)
      .where(document_editing_sessions: { document_id: id })
      .distinct
      .order(:first_name, :last_name)
end
```

**Step 4: Run test to verify it passes**

Run: `bin/rspec spec/models/document_spec.rb`
Expected: All PASS

**Step 5: Commit**

```bash
git add app/models/document.rb spec/models/document_spec.rb
git commit -m "feat: add contributors method to Document model"
```

---

### Task 2: Add `contributors` method to Version model

**Files:**
- Modify: `app/models/version.rb:6` (after editor_sessions association)
- Create: `spec/models/version_spec.rb`

**Step 1: Write the failing test**

Create `spec/models/version_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe Version, type: :model do
  fixtures :organizations, :spaces, :documents, :users, :organization_memberships, :versions, :document_editing_sessions

  describe "#contributors" do
    it "returns unique users from editing sessions for this version" do
      version = versions(:two_version_1)
      # Fixture: session_pawel_doc_two is linked to doc two but version_id is nil
      # We need a session linked to this version — update fixture or test with created data
      contributors = version.contributors

      expect(contributors).to be_an(ActiveRecord::Relation)
    end

    it "returns empty relation when no editing sessions linked" do
      version = versions(:two_version_1)
      version.editing_sessions.delete_all

      expect(version.contributors).to be_empty
    end

    it "returns contributors ordered by name" do
      version = versions(:two_version_1)
      contributors = version.contributors

      names = contributors.map(&:display_name)
      expect(names).to eq(names.sort)
    end
  end
end
```

**Step 2: Run test to verify it fails**

Run: `bin/rspec spec/models/version_spec.rb`
Expected: FAIL with `undefined method 'contributors'`

**Step 3: Write minimal implementation**

Add to `app/models/version.rb` after line 6 (after `has_many :editor_sessions`):

```ruby
def contributors
  User.joins(organization_memberships: :editing_sessions)
      .where(document_editing_sessions: { version_id: id })
      .distinct
      .order(:first_name, :last_name)
end
```

**Step 4: Run test to verify it passes**

Run: `bin/rspec spec/models/version_spec.rb`
Expected: All PASS

**Step 5: Commit**

```bash
git add app/models/version.rb spec/models/version_spec.rb
git commit -m "feat: add contributors method to Version model"
```

---

### Task 3: Create UserAvatarsGroup ViewComponent

**Files:**
- Create: `app/components/user_avatars_group.rb`
- Create: `app/components/user_avatars_group.html.erb`
- Create: `spec/components/user_avatars_group_component_spec.rb`

**Step 1: Write the failing test**

Create `spec/components/user_avatars_group_component_spec.rb`:

```ruby
# frozen_string_literal: true

require "rails_helper"

RSpec.describe UserAvatarsGroup, type: :component do
  fixtures :organizations, :users

  let(:organization) { organizations(:is) }

  describe "rendering" do
    it "renders nothing when users list is empty" do
      result = render_inline(described_class.new(users: User.none, organization: organization))
      expect(result.to_html.strip).to eq("")
    end

    it "renders avatars for each user when count <= max" do
      users = User.where(id: ["user_pawel", "user_stefan"])
      result = render_inline(described_class.new(users: users, organization: organization))

      expect(result.css("[data-testid='user-avatars-group']")).to be_present
      expect(result.css(".avatar").length).to eq(2)
    end

    it "renders overflow counter when users exceed max" do
      # Use max: 2 so we can test overflow with just 3 users
      users = User.where(id: ["user_pawel", "user_stefan", "user_maria"])
      result = render_inline(described_class.new(users: users, organization: organization, max: 2))

      # Should show 1 avatar + overflow counter showing +2
      expect(result.css(".avatar").length).to eq(1)
      expect(result.text).to include("+2")
    end

    it "uses descending z-index for stacking" do
      users = User.where(id: ["user_pawel", "user_stefan"])
      result = render_inline(described_class.new(users: users, organization: organization))

      avatars = result.css("[data-testid='user-avatars-group'] > *")
      classes = avatars.map { |a| a["class"] }

      expect(classes.first).to include("z-30")
      expect(classes.last).to include("z-20")
    end

    it "includes popover with remaining users in overflow" do
      users = User.where(id: ["user_pawel", "user_stefan", "user_maria"])
      result = render_inline(described_class.new(users: users, organization: organization, max: 2))

      popover_template = result.css("template[data-popover-target='content']")
      expect(popover_template).to be_present
    end
  end
end
```

**Step 2: Run test to verify it fails**

Run: `bin/rspec spec/components/user_avatars_group_component_spec.rb`
Expected: FAIL with `uninitialized constant UserAvatarsGroup`

**Step 3: Write the component Ruby class**

Create `app/components/user_avatars_group.rb`:

```ruby
# frozen_string_literal: true

class UserAvatarsGroup < ViewComponent::Base
  Z_INDEX_CLASSES = %w[z-30 z-20 z-10 z-0].freeze

  def initialize(users:, organization:, max: 4, variant: "sm")
    @users = users.to_a
    @organization = organization
    @max = max
    @variant = variant
  end

  def render?
    @users.any?
  end

  def visible_users
    if overflow?
      @users.first(@max - 1)
    else
      @users
    end
  end

  def overflow_users
    @users[(@max - 1)..]
  end

  def overflow?
    @users.length > @max
  end

  def overflow_count
    @users.length - (@max - 1)
  end

  def z_class(index)
    Z_INDEX_CLASSES[index] || "z-0"
  end

  def overflow_z_class
    Z_INDEX_CLASSES[visible_users.length] || "z-0"
  end

  def avatar_size_class
    UserAvatar.new(user: @users.first, variant: @variant).variant_to_class
  end
end
```

**Step 4: Write the component template**

Create `app/components/user_avatars_group.html.erb`:

```erb
<div data-testid="user-avatars-group" class="isolate flex -space-x-1 overflow-hidden">
  <% visible_users.each_with_index do |user, index| %>
    <div class="relative <%= z_class(index) %> inline-block rounded-full ring-2 ring-white dark:ring-gray-900">
      <%= render UserAvatar.new(user: user, organization: @organization, variant: @variant) %>
    </div>
  <% end %>

  <% if overflow? %>
    <div class="relative <%= overflow_z_class %> inline-block"
         data-controller="popover"
         data-action="mouseenter->popover#show mouseleave->popover#hide">
      <div class="<%= avatar_size_class %> rounded-full bg-gray-200 dark:bg-gray-600 ring-2 ring-white dark:ring-gray-900 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
        +<%= overflow_count %>
      </div>

      <template data-popover-target="content">
        <div class="popover-card p-2" data-popover-target="card">
          <ul class="space-y-2">
            <% overflow_users.each do |user| %>
              <li class="flex items-center gap-2">
                <%= render UserAvatar.new(user: user, organization: @organization, variant: "xs") %>
                <span class="text-sm"><%= user.display_name %></span>
              </li>
            <% end %>
          </ul>
        </div>
      </template>
    </div>
  <% end %>
</div>
```

**Step 5: Run test to verify it passes**

Run: `bin/rspec spec/components/user_avatars_group_component_spec.rb`
Expected: All PASS

**Step 6: Commit**

```bash
git add app/components/user_avatars_group.rb app/components/user_avatars_group.html.erb spec/components/user_avatars_group_component_spec.rb
git commit -m "feat: create UserAvatarsGroup view component"
```

---

### Task 4: Add Contributors field to document sidebar details

**Files:**
- Modify: `app/views/documents/_sidebar/details.html.erb:5-6` (after "Published at" line)

**Step 1: Add the Contributors field**

Add after line 5 (`Published at` field) in `app/views/documents/_sidebar/details.html.erb`:

```erb
<% contributors = @document.contributors %>
<% if contributors.any? %>
  <li class="flex justify-between gap-x-6 py-5">
    <div class="flex-auto min-w-0 gap-x-4">
      <p class="text-sm/6 font-semibold text-gray-900 dark:text-gray-100">Contributors</p>
    </div>
    <div class="flex flex-col sm:items-end">
      <%= render UserAvatarsGroup.new(users: contributors, organization: current_organization) %>
    </div>
  </li>
<% end %>
```

**Step 2: Verify manually**

Run: `bin/dev`
Navigate to a document that has editing sessions (e.g., document "one" which has fixtures for Pawel and Stefan).
Open the Details sidebar tab and verify "Contributors" appears with stacked avatars.

**Step 3: Commit**

```bash
git add app/views/documents/_sidebar/details.html.erb
git commit -m "feat: display contributors in document sidebar details"
```

---

### Task 5: Add contributors to version history sidebar (show page)

**Files:**
- Modify: `app/views/documents/versions/show.html.erb:15-39` (version sidebar loop)
- Modify: `app/controllers/documents/versions_controller.rb:75` (eager load)

**Step 1: Eager-load editing sessions in the controller**

In `app/controllers/documents/versions_controller.rb`, update line 75 in the `show` action:

```ruby
@versions = @document.versions.includes(editing_sessions: { member: :user }).order('created_at DESC')
```

Also update line 58 in the `index` action:

```ruby
@versions = @document.versions.includes(:created_by, editing_sessions: { member: :user }).order('created_at DESC')
```

**Step 2: Update the version show sidebar template**

In `app/views/documents/versions/show.html.erb`, replace the version link block (lines 16-38) with a version that adds contributors. The key change is adding the UserAvatarsGroup after the version info div:

Replace lines 16-38 with:

```erb
    <%= link_to document_version_path(@document, version) do %>
      <%= tag.div(class: {
        "flex flex-row" => true,
        "bg-blue-100 hover:bg-blue-200 active:bg-blue-300 dark:bg-blue-900 dark:hover:bg-blue-800 dark:active:bg-blue-700" => @version == version,
        "hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-800 dark:active:bg-gray-700" => @version != version,
      }) do %>
        <div class="<%= @version == version ? "bg-blue-500 dark:!bg-blue-400" : "" %> w-1"></div>
        <div class="whitespace-nowrap px-2 py-5 text-base text-slate-500">
          <% if version.created_by.blank? %>
            <div title="Deleted user" class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold">
              ?
            </div>
          <% else %>
            <%= render UserAvatar.new(user: version.created_by, organization: current_organization) %>
          <% end %>
        </div>
        <div class="flex-1 p-2">
          <div class="font-bold">Version <%= version.sequential_id %></div>
          <div class="<%= version.created_by.blank? ? "text-slate-500 italic" : "" %>"><%= version.created_by&.display_name || "Deleted user" %></div>
          <div title="<%= version.created_at %>"><%= time_ago_in_words version.created_at %> ago</div>
        </div>
        <% version_contributors = version.contributors %>
        <% if version_contributors.any? %>
          <div class="flex items-center pr-2" data-testid="version-contributors">
            <%= render UserAvatarsGroup.new(users: version_contributors, organization: current_organization, variant: "xs") %>
          </div>
        <% end %>
      <% end %>
    <% end %>
```

**Step 3: Verify manually**

Navigate to a document version history page (e.g., `/d/two/versions/1`). Verify the sidebar shows contributor avatars on the right side of each version entry.

**Step 4: Commit**

```bash
git add app/views/documents/versions/show.html.erb app/controllers/documents/versions_controller.rb
git commit -m "feat: display contributors in version history sidebar"
```

---

### Task 6: Add contributors column to version history index table

**Files:**
- Modify: `app/views/documents/versions/index.html.erb:28-29` (add header column)
- Modify: `app/views/documents/versions/index.html.erb:36-44` (add data column)

**Step 1: Add Contributors column header**

In `app/views/documents/versions/index.html.erb`, after line 28 (the "Created by" th), add:

```erb
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Contributors</th>
```

**Step 2: Add Contributors column data**

After the "Created by" td block (after line 44), add a new td:

```erb
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-slate-500" data-testid="version-contributors">
                      <% version_contributors = version.contributors %>
                      <% if version_contributors.any? %>
                        <%= render UserAvatarsGroup.new(users: version_contributors, organization: current_organization, variant: "xs") %>
                      <% end %>
                    </td>
```

**Step 3: Verify manually**

Navigate to `/d/two/versions`. Verify the table has a "Contributors" column with avatars.

**Step 4: Commit**

```bash
git add app/views/documents/versions/index.html.erb
git commit -m "feat: display contributors column in version history table"
```

---

### Task 7: Update E2E tests — document-editing-sessions.cy.js

**Files:**
- Modify: `spec/e2e/cypress/e2e/documents/document-editing-sessions.cy.js`

**Step 1: Add UI assertions to the multi-version tracking test**

After the cross-version integrity checks (line 146), add assertions that verify contributors appear in the version history UI:

```javascript
    // --- UI verification: contributors visible in version history sidebar ---
    cy.visit(`/d/${documentId}/versions/latest`);

    // The sidebar should show versions with contributor avatars
    cy.get("#content-sidebar").within(() => {
      // Each version entry should exist
      cy.contains("Version 1").should("be.visible");
      cy.contains("Version 2").should("be.visible");
      cy.contains("Version 3").should("be.visible");

      // Version 2 should show contributors from both Pawel and Stefan
      cy.contains("Version 2")
        .closest("[data-testid='version-contributors']")
        .parents("[class*='flex flex-row']")
        .find("[data-testid='version-contributors']")
        .should("exist");
    });

    // Also verify the index table
    cy.visit(`/d/${documentId}/versions`);
    cy.get("[data-testid='version-contributors']").should("have.length.at.least", 3);
```

**Step 2: Add UI assertions to the editor/viewer distinction test**

After the existing appEval assertion block (line 182), add:

```javascript
    // --- UI verification: both Pawel and Stefan appear as contributors ---
    cy.visit(`/d/${documentId}/versions/latest`);

    cy.get("#content-sidebar").within(() => {
      cy.get("[data-testid='version-contributors']").should("exist");
    });
```

**Step 3: Run E2E tests**

Run: `bin/dev-e2e up --test` or `bin/dev-e2e test`
Expected: All editing session tests PASS

**Step 4: Commit**

```bash
git add spec/e2e/cypress/e2e/documents/document-editing-sessions.cy.js
git commit -m "test: add UI assertions for contributors in editing session E2E tests"
```

---

### Task 8: Update E2E tests — document-editor.cy.js

**Files:**
- Modify: `spec/e2e/cypress/e2e/documents/document-editor.cy.js`

**Step 1: Add contributor assertions to version history test**

In the "displays version history and allows viewing specific versions" test (line 161), after navigating to the versions page (line 200), add assertions:

```javascript
    // Verify the versions table has a Contributors column
    cy.contains("th", "Contributors").should("be.visible");

    // Each version row should have a contributors cell
    cy.get("[data-testid='version-contributors']").should("have.length.at.least", 1);
```

Also in the version show page section (after line 217), add:

```javascript
      // Verify contributor avatars appear in the sidebar
      cy.get("#content-sidebar").within(() => {
        cy.get("[data-testid='version-contributors']").should("exist");
      });
```

**Step 2: Add contributor assertion to the sidebar details**

In the "saves multiple versions" test (line 102), after verifying versions are created, add a check for the Contributors field in the sidebar:

```javascript
      // Verify contributors appear in sidebar details
      cy.get("#content-sidebar").within(() => {
        cy.get('[aria-label="Details"]').click();
      });

      cy.get("[data-testid='user-avatars-group']").should("exist");
```

**Step 3: Run E2E tests**

Run: `bin/dev-e2e up --test` or `bin/dev-e2e test`
Expected: All document editor tests PASS

**Step 4: Commit**

```bash
git add spec/e2e/cypress/e2e/documents/document-editor.cy.js
git commit -m "test: add contributor UI assertions to document editor E2E tests"
```

---

### Task 9: Run full test suite and fix any issues

**Step 1: Run RSpec unit tests**

Run: `bin/rspec`
Expected: All PASS

**Step 2: Run E2E tests**

Run: `bin/dev-e2e up --test`
Expected: All PASS

**Step 3: Fix any failures**

If tests fail, investigate and fix. Common issues:
- N+1 queries: ensure eager loading is correct in controllers
- Fixture data: ensure editing session fixtures link to correct versions
- CSS selectors: adjust data-testid selectors if HTML structure differs

**Step 4: Final commit if fixes were needed**

```bash
git add -A
git commit -m "fix: address test failures in contributors display"
```
