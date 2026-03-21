# Document Editing Sessions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Track which users were present and which made edits for each document version, using per-session records linked to organization memberships.

**Architecture:** A new `DocumentEditingSession` model records each WebSocket connection to the `DocumentChannel`. Sessions are created on subscribe, marked as edited on first Y.js update, closed on unsubscribe, and claimed by versions when versions are saved. Links to `OrganizationMembership` (not `User`) for tenant-scoped durability.

**Tech Stack:** Ruby on Rails 8.1, PostgreSQL, ActionCable, RSpec

**Design doc:** `docs/plans/2026-02-27-document-editing-sessions-design.md`

---

### Task 1: Migration

**Files:**
- Create: `db/migrate/XXXXXX_create_document_editing_sessions.rb`

**Step 1: Generate the migration**

Run: `bin/rails generate migration CreateDocumentEditingSessions`

**Step 2: Write the migration**

Edit the generated file to contain:

```ruby
class CreateDocumentEditingSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :document_editing_sessions, id: :string do |t|
      t.references :document, null: false, foreign_key: true, type: :string
      t.references :member, null: false, foreign_key: { to_table: :organization_memberships }, type: :string
      t.references :version, null: true, foreign_key: true

      t.datetime :connected_at, null: false
      t.datetime :disconnected_at
      t.boolean :edited, default: false, null: false

      t.timestamps
    end

    add_index :document_editing_sessions, [:document_id, :version_id]
    add_index :document_editing_sessions, [:document_id, :member_id]
  end
end
```

Note: `version` FK is integer (versions table uses default integer PK). `document` and `member` FKs are `:string` (NPI tables).

**Step 3: Run the migration**

Run: `bin/rails db:migrate`
Expected: Migration completes, `db/schema.rb` updated with new table.

**Step 4: Commit**

```bash
git add db/migrate/*_create_document_editing_sessions.rb db/schema.rb
git commit -m "feat: add document_editing_sessions table for author tracking"
```

---

### Task 2: Model with tests (TDD)

**Files:**
- Create: `app/models/document_editing_session.rb`
- Create: `spec/models/document_editing_session_spec.rb`
- Create: `spec/fixtures/document_editing_sessions.yml`

**Step 1: Create fixtures**

```yaml
# spec/fixtures/document_editing_sessions.yml
_fixture:
  model_class: DocumentEditingSession

session_pawel_doc_one_linked:
  id: des_pawel_v1
  document_id: one
  member_id: om_is_pawel
  version_id: 1
  connected_at: <%= 2.hours.ago.to_fs(:db) %>
  disconnected_at: <%= 1.hour.ago.to_fs(:db) %>
  edited: true

session_stefan_doc_one_linked:
  id: des_stefan_v1
  document_id: one
  member_id: om_is_stefan
  version_id: 1
  connected_at: <%= 2.hours.ago.to_fs(:db) %>
  disconnected_at: <%= 1.hour.ago.to_fs(:db) %>
  edited: false

session_pawel_doc_one_unlinked:
  id: des_pawel_unlinked
  document_id: one
  member_id: om_is_pawel
  connected_at: <%= 30.minutes.ago.to_fs(:db) %>
  edited: true
```

Note: `version_id` references the versions fixture `two_version_1` which has `id: 1` (auto-increment). Check if the fixture ID is actually 1 by looking at the versions fixture — it doesn't set an explicit integer id, so Rails will auto-assign. We need to reference the fixture by name. Actually, versions uses integer PK with auto-increment — fixture references use the fixture label name, Rails resolves them. But since `version_id` is a plain integer FK (not a belongs_to in the fixture), we need the actual ID. The safest approach: don't hardcode the integer — use ERB to reference the fixture.

Revised fixture approach — use `nil` for version_id in the "linked" fixtures and set them up in the test instead, keeping fixtures simple:

```yaml
# spec/fixtures/document_editing_sessions.yml
_fixture:
  model_class: DocumentEditingSession

session_pawel_doc_one:
  id: des_pawel_1
  document_id: one
  member_id: om_is_pawel
  connected_at: <%= 2.hours.ago.to_fs(:db) %>
  disconnected_at: <%= 1.hour.ago.to_fs(:db) %>
  edited: true

session_stefan_doc_one:
  id: des_stefan_1
  document_id: one
  member_id: om_is_stefan
  connected_at: <%= 2.hours.ago.to_fs(:db) %>
  disconnected_at: <%= 1.hour.ago.to_fs(:db) %>
  edited: false

session_pawel_doc_two:
  id: des_pawel_2
  document_id: two
  member_id: om_is_pawel
  connected_at: <%= 30.minutes.ago.to_fs(:db) %>
  edited: true
```

**Step 2: Write the failing model spec**

```ruby
# spec/models/document_editing_session_spec.rb
require "rails_helper"

RSpec.describe DocumentEditingSession, type: :model do
  fixtures :organizations, :users, :organization_memberships,
           :spaces, :documents, :document_editing_sessions

  describe "associations" do
    let(:session) { document_editing_sessions(:session_pawel_doc_one) }

    it "belongs to a document" do
      expect(session.document).to eq(documents(:one))
    end

    it "belongs to a member (organization membership)" do
      expect(session.member).to eq(organization_memberships(:om_is_pawel))
    end

    it "optionally belongs to a version" do
      expect(session.version).to be_nil
    end
  end

  describe "NPI primary key" do
    let(:session) { document_editing_sessions(:session_pawel_doc_one) }

    it "has a string id" do
      expect(session.id).to be_a(String)
    end
  end

  describe ".editors" do
    it "returns only sessions where edited is true" do
      editors = DocumentEditingSession.where(document: documents(:one)).editors
      expect(editors).to include(document_editing_sessions(:session_pawel_doc_one))
      expect(editors).not_to include(document_editing_sessions(:session_stefan_doc_one))
    end
  end

  describe ".unlinked" do
    it "returns only sessions with no version" do
      unlinked = DocumentEditingSession.unlinked
      expect(unlinked).to include(document_editing_sessions(:session_pawel_doc_two))
      expect(unlinked).not_to include(document_editing_sessions(:session_pawel_doc_one))
    end
  end
end
```

**Step 3: Run test to verify it fails**

Run: `bin/rspec spec/models/document_editing_session_spec.rb`
Expected: FAIL — `uninitialized constant DocumentEditingSession`

**Step 4: Write the model**

```ruby
# app/models/document_editing_session.rb
class DocumentEditingSession < ApplicationRecord
  belongs_to :document
  belongs_to :member, class_name: "OrganizationMembership"
  belongs_to :version, optional: true

  scope :editors, -> { where(edited: true) }
  scope :unlinked, -> { where(version_id: nil) }
end
```

**Step 5: Run test to verify it passes**

Run: `bin/rspec spec/models/document_editing_session_spec.rb`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add app/models/document_editing_session.rb spec/models/document_editing_session_spec.rb spec/fixtures/document_editing_sessions.yml
git commit -m "feat: add DocumentEditingSession model with specs"
```

---

### Task 3: Add associations to existing models

**Files:**
- Modify: `app/models/document.rb:18` (add has_many)
- Modify: `app/models/version.rb:2-3` (add has_many)
- Modify: `app/models/organization_membership.rb:17` (add has_many)

**Step 1: Add association to Document**

In `app/models/document.rb`, after line 25 (`has_many :attachments, as: :parent, dependent: :destroy`), add:

```ruby
  has_many :editing_sessions, class_name: "DocumentEditingSession", dependent: :delete_all
```

**Step 2: Add associations to Version**

In `app/models/version.rb`, after line 3 (`belongs_to :created_by, class_name: "User", optional: true`), add:

```ruby
  has_many :editing_sessions, class_name: "DocumentEditingSession"
  has_many :editor_sessions, -> { where(edited: true) }, class_name: "DocumentEditingSession"
```

**Step 3: Add association to OrganizationMembership**

In `app/models/organization_membership.rb`, after line 17 (`has_many :space_memberships, inverse_of: :member, dependent: :delete_all`), add:

```ruby
  has_many :editing_sessions, class_name: "DocumentEditingSession", foreign_key: :member_id, dependent: :delete_all
```

**Step 4: Run existing tests to verify no regressions**

Run: `bin/rspec spec/models/document_spec.rb spec/models/version_spec.rb spec/models/organization_membership_spec.rb`
Expected: All existing tests PASS

**Step 5: Commit**

```bash
git add app/models/document.rb app/models/version.rb app/models/organization_membership.rb
git commit -m "feat: add editing_sessions associations to Document, Version, OrganizationMembership"
```

---

### Task 4: DocumentChannel session tracking (TDD)

**Files:**
- Modify: `app/channels/document_channel.rb`
- Modify: `spec/channels/document_channel_spec.rb`

**Step 1: Write failing channel specs**

Add to `spec/channels/document_channel_spec.rb`, inside the existing `describe "#subscribed"` block, after the existing contexts:

```ruby
  describe "editing session tracking" do
    let(:organization_membership) { organization_memberships(:om_is_pawel) }
    let(:document) { documents(:one) }

    context "on subscribe" do
      it "creates a DocumentEditingSession" do
        expect {
          subscribe(documentId: document.id)
        }.to change(DocumentEditingSession, :count).by(1)
      end

      it "sets connected_at and links to the correct member" do
        subscribe(documentId: document.id)

        session = DocumentEditingSession.last
        expect(session.document).to eq(document)
        expect(session.member).to eq(organization_membership)
        expect(session.connected_at).to be_present
        expect(session.edited).to be(false)
        expect(session.version_id).to be_nil
      end

      it "does not create a session when subscription is rejected" do
        stub_connection(
          current_user: user,
          current_organization: organization,
          pundit_user: PolicyUserContext.new(user, organization)
        )

        expect {
          subscribe(documentId: "nonexistent")
        }.not_to change(DocumentEditingSession, :count)
      end
    end

    context "on receive" do
      it "marks the session as edited on first receive" do
        subscribe(documentId: document.id)
        session = DocumentEditingSession.last
        expect(session.edited).to be(false)

        # Simulate receiving a Y.js update
        perform(:receive, { "update" => "data" })

        session.reload
        expect(session.edited).to be(true)
      end

      it "does not perform extra DB writes on subsequent receives" do
        subscribe(documentId: document.id)

        perform(:receive, { "update" => "data1" })

        expect {
          perform(:receive, { "update" => "data2" })
        }.not_to change { DocumentEditingSession.last.updated_at }
      end
    end

    context "on unsubscribe" do
      it "sets disconnected_at on the session" do
        subscribe(documentId: document.id)
        session = DocumentEditingSession.last
        expect(session.disconnected_at).to be_nil

        subscription.unsubscribe_from_channel

        session.reload
        expect(session.disconnected_at).to be_present
      end
    end
  end
```

Also add `:document_editing_sessions` to the fixtures list at the top of the file:

```ruby
fixtures :organizations, :users, :organization_memberships,
         :spaces, :space_memberships, :documents, :document_editing_sessions
```

**Step 2: Run tests to verify they fail**

Run: `bin/rspec spec/channels/document_channel_spec.rb`
Expected: New tests FAIL — no editing session is created

**Step 3: Implement session tracking in DocumentChannel**

Replace `app/channels/document_channel.rb` with:

```ruby
class DocumentChannel < ApplicationCable::Channel
  include Y::Actioncable::Sync

  def initialize(connection, identifier, params = nil)
    super
    document_id = params[:documentId]
    load { |_| load_doc(document_id) }
  rescue
    logger.error "Could not load document sync for #{document_id}."
    nil
  end

  def subscribed
    document_id = params[:documentId]
    document = find_document(document_id)

    unless document && authorized_to_update?(document)
      reject
      return
    end

    @editing_session = DocumentEditingSession.create!(
      document: document,
      member: current_membership,
      connected_at: Time.current
    )

    sync_from("document/#{document_id}") do |_|
      persist do |_, update|
        save_doc(document_id, update)
      end
    end
  end

  def receive(data)
    document_id = params[:documentId]
    sync("document/#{document_id}", data)

    unless @marked_as_edited
      @editing_session&.update_columns(edited: true)
      @marked_as_edited = true
    end
  end

  def unsubscribed
    @editing_session&.update_columns(disconnected_at: Time.current)
  end

  private

  def find_document(document_id)
    current_organization.documents.find_by(id: document_id)
  end

  def current_membership
    @current_membership ||= OrganizationMembership.find_by!(
      organization: current_organization,
      user: current_user
    )
  end

  def load_doc(document_id)
    data = find_document(document_id).sync
    data = data.unpack("C*") unless data.nil?
    data
  end

  def save_doc(document_id, update)
    document = find_document(document_id)

    return unless document && authorized_to_update?(document)

    document.update(sync: update.pack("C*"))
  rescue
    logger.error "Document sync #{document_id} could not be saved"
  end

  def authorized_to_update?(document)
    DocumentPolicy.new(pundit_user, document).update?
  end
end
```

**Step 4: Run tests to verify they pass**

Run: `bin/rspec spec/channels/document_channel_spec.rb`
Expected: All tests PASS (including existing authorization tests)

**Step 5: Commit**

```bash
git add app/channels/document_channel.rb spec/channels/document_channel_spec.rb
git commit -m "feat: track editing sessions in DocumentChannel (subscribe/receive/unsubscribe)"
```

---

### Task 5: Version creation claims sessions (TDD)

**Files:**
- Modify: `app/controllers/documents/versions_controller.rb:32`
- Create: `spec/requests/documents/versions_controller_spec.rb`

**Step 1: Write failing request spec**

```ruby
# spec/requests/documents/versions_controller_spec.rb
require "rails_helper"

RSpec.describe Documents::VersionsController, type: :request do
  fixtures :organizations, :users, :organization_memberships,
           :spaces, :documents, :document_editing_sessions

  let(:pawel) { users(:pawel) }
  let(:ikigai_systems) { organizations(:is) }
  let(:document) { documents(:two) }

  before do
    sign_in pawel
    post select_organization_path(ikigai_systems)
  end

  describe "POST /d/:document_id/versions" do
    let(:content_blocks) do
      [{ "id" => "block1", "type" => "paragraph", "content" => [{ "type" => "text", "text" => "Hello" }] }].to_json
    end

    it "claims unlinked editing sessions for the document" do
      # Create unlinked sessions for this document
      session1 = DocumentEditingSession.create!(
        document: document,
        member: organization_memberships(:om_is_pawel),
        connected_at: 1.hour.ago,
        disconnected_at: 30.minutes.ago,
        edited: true
      )
      session2 = DocumentEditingSession.create!(
        document: document,
        member: organization_memberships(:om_is_stefan),
        connected_at: 1.hour.ago,
        disconnected_at: 30.minutes.ago,
        edited: false
      )

      post document_versions_path(document), params: { content_blocks: content_blocks }

      version = document.versions.order(created_at: :desc).first

      session1.reload
      session2.reload
      expect(session1.version).to eq(version)
      expect(session2.version).to eq(version)
    end

    it "does not claim sessions already linked to a previous version" do
      previous_version = document.versions.create!(
        content_blocks: [],
        created_by: pawel
      )
      already_linked = DocumentEditingSession.create!(
        document: document,
        member: organization_memberships(:om_is_pawel),
        connected_at: 2.hours.ago,
        disconnected_at: 1.hour.ago,
        edited: true,
        version: previous_version
      )

      post document_versions_path(document), params: { content_blocks: content_blocks }

      already_linked.reload
      expect(already_linked.version).to eq(previous_version)
    end

    it "does not claim sessions from other documents" do
      other_doc_session = document_editing_sessions(:session_pawel_doc_one)

      post document_versions_path(document), params: { content_blocks: content_blocks }

      other_doc_session.reload
      expect(other_doc_session.version_id).to be_nil
    end

    it "allows querying editors vs present members on the version" do
      DocumentEditingSession.create!(
        document: document,
        member: organization_memberships(:om_is_pawel),
        connected_at: 1.hour.ago,
        edited: true
      )
      DocumentEditingSession.create!(
        document: document,
        member: organization_memberships(:om_is_stefan),
        connected_at: 1.hour.ago,
        edited: false
      )

      post document_versions_path(document), params: { content_blocks: content_blocks }

      version = document.versions.order(created_at: :desc).first
      expect(version.editing_sessions.count).to eq(2)
      expect(version.editor_sessions.count).to eq(1)
      expect(version.editor_sessions.first.member).to eq(organization_memberships(:om_is_pawel))
    end
  end
end
```

**Step 2: Run test to verify it fails**

Run: `bin/rspec spec/requests/documents/versions_controller_spec.rb`
Expected: FAIL — sessions are not claimed (version_id remains nil)

**Step 3: Add session claiming to the controller**

In `app/controllers/documents/versions_controller.rb`, after `if @version.save` (line 32), add:

```ruby
      @document.editing_sessions.unlinked.update_all(version_id: @version.id)
```

The full `create` method should read:

```ruby
  def create
    authorize @document, :update?

    content_blocks = JSON.parse(params["content_blocks"].to_s)

    if ENV["BLOCKNOTE_DIFF"].to_bool
      blocks2 = @document.to_blocks

      diff = HashDiff.diff(blocks, blocks2)
      if diff.present?
        Sentry.capture_message("XmlfragmentToBlock mismatch for #{@space.id} / #{@document.id} (call stefan) : #{diff}")
        flash[:alert] = "Detected document desynchronization between your local version and server. This might mean network connection problems, server performance problems or someone else editing the document concurrently. Proceeding with saving your local version."
      end
    end

    @version = @document.versions.new
    @version.content_blocks = content_blocks
    @version.created_by = current_user

    if @version.save
      @document.editing_sessions.unlinked.update_all(version_id: @version.id)

      respond_to do |format|
        flash[:notice] = "Document has been updated."
        format.html { redirect_to document_path(@document) }
      end
    else
      render :new, status: :unprocessable_content
    end
  rescue Exception => e
    respond_to do |format|
      format.html { raise e }
      format.turbo_stream do
        flash[:error] = e.to_s
        render turbo_stream: [turbo_stream.append("flashes", partial: "flash_messages_as_alerts", locals: { flash: flash})]
        flash.clear
      end
    end
  end
```

**Step 4: Run test to verify it passes**

Run: `bin/rspec spec/requests/documents/versions_controller_spec.rb`
Expected: All tests PASS

**Step 5: Run full test suite to verify no regressions**

Run: `bin/rspec spec/channels/document_channel_spec.rb spec/models/document_editing_session_spec.rb spec/requests/documents/versions_controller_spec.rb`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add app/controllers/documents/versions_controller.rb spec/requests/documents/versions_controller_spec.rb
git commit -m "feat: claim unlinked editing sessions when a version is created"
```

---

### Task 6: E2E test — multi-version contributor attribution

**Files:**
- Create: `cypress/e2e/document_editing_sessions_spec.cy.js` (or `.ts` if TypeScript is used)

This task depends on the Cypress E2E setup (`bin/dev-e2e`). The test exercises the full flow across 3 versions with changing contributor sets.

**Step 1: Write the E2E test**

This test requires:
- 3 users from dev seeds (e.g., users from the same org)
- A shared document in a public space
- The ability to open the BlockNote editor, type, and save versions

The exact Cypress selectors and authentication flow depend on the app's UI. The test structure:

```javascript
describe("Document editing sessions — multi-version attribution", () => {
  // Use dev seed users from the same organization
  // Authenticate using the ?as= backdoor (dev-only middleware)

  const baseUrl = Cypress.config("baseUrl"); // e.g., http://localhost:4000

  // Helper: open document as a specific user
  function openDocumentAs(email, documentPath) {
    cy.session(email, () => {
      cy.visit(`${documentPath}?as=${email}`);
    });
    cy.visit(`${documentPath}/edit`);
  }

  // Helper: type text in the BlockNote editor
  function typeInEditor(text) {
    cy.get("[data-testid='blocknote-editor']", { timeout: 10000 })
      .click()
      .type(text);
  }

  // Helper: save a version
  function saveVersion() {
    cy.get("[data-testid='save-version-button']").click();
    cy.contains("Document has been updated.").should("be.visible");
  }

  it("correctly attributes sessions across 3 versions with changing contributors", () => {
    // Setup: create a document via API or use a seed document
    // The exact implementation depends on available test helpers

    // --- Version 1: Two editors (Sarah + James) ---
    // Sarah opens and edits
    openDocumentAs("sarah@brightpath.example.com", "/d/test-doc");
    typeInEditor("Sarah's contribution to version 1. ");

    // James opens and edits (in a separate session)
    openDocumentAs("james@brightpath.example.com", "/d/test-doc");
    typeInEditor("James's contribution to version 1. ");

    // Sarah saves the version
    openDocumentAs("sarah@brightpath.example.com", "/d/test-doc");
    saveVersion();

    // Verify version 1 attribution via API or database check
    cy.request("/api/v1/documents/test-doc/versions/1/editing_sessions").then((response) => {
      const sessions = response.body;
      expect(sessions.length).to.eq(2);
      expect(sessions.every(s => s.edited)).to.be.true;
      const memberIds = sessions.map(s => s.member_id);
      // Both Sarah and James should be present
      expect(memberIds).to.have.length(2);
    });

    // --- Version 2: One editor (Sarah) + one viewer (Maria) ---
    openDocumentAs("maria@brightpath.example.com", "/d/test-doc");
    // Maria just views, does not type

    openDocumentAs("sarah@brightpath.example.com", "/d/test-doc");
    typeInEditor("Sarah's contribution to version 2. ");
    saveVersion();

    // Verify version 2: Sarah edited, Maria present-only
    cy.request("/api/v1/documents/test-doc/versions/2/editing_sessions").then((response) => {
      const sessions = response.body;
      expect(sessions.length).to.eq(2);
      const edited = sessions.filter(s => s.edited);
      const viewOnly = sessions.filter(s => !s.edited);
      expect(edited.length).to.eq(1); // Sarah
      expect(viewOnly.length).to.eq(1); // Maria
    });

    // --- Version 3: Solo editor (James), others disconnected ---
    // Sarah and Maria close the document (navigate away)
    // James reconnects and edits
    openDocumentAs("james@brightpath.example.com", "/d/test-doc");
    typeInEditor("James's solo contribution to version 3. ");
    saveVersion();

    // Verify version 3: only James
    cy.request("/api/v1/documents/test-doc/versions/3/editing_sessions").then((response) => {
      const sessions = response.body;
      expect(sessions.length).to.eq(1);
      expect(sessions[0].edited).to.be.true;
    });

    // --- Cross-version integrity ---
    // No session should be linked to multiple versions
    // Version 1 sessions should still only belong to version 1
    cy.request("/api/v1/documents/test-doc/versions/1/editing_sessions").then((response) => {
      expect(response.body.length).to.eq(2); // unchanged from earlier
    });
  });
});
```

**Important notes for the implementer:**
- The exact CSS selectors (`[data-testid='blocknote-editor']`, `[data-testid='save-version-button']`) need to be verified against the actual UI. Add `data-testid` attributes if they don't exist.
- The API endpoint `/api/v1/documents/:id/versions/:seq/editing_sessions` does not exist yet. Either:
  - (a) Create a simple API endpoint to expose editing sessions for test verification, OR
  - (b) Use `cy.task()` to query the database directly from Cypress, OR
  - (c) Verify via the version history UI if it displays contributor info
- The `?as=` authentication backdoor is available in dev/test environments per the CLAUDE.md.
- Concurrent editing (two users editing the same doc simultaneously) is the hardest part to test in Cypress. Consider using `cy.session()` to switch between users, understanding that this means sequential — not truly concurrent — connections. The ActionCable session from user A will be closed when Cypress switches to user B.

**Step 2: Run the E2E test**

Run: `bin/dev-e2e up --test` (or `bin/dev-e2e test` if environment is already running)
Expected: Test passes

**Step 3: Commit**

```bash
git add cypress/
git commit -m "test: add E2E test for multi-version editing session attribution"
```

---

### Task 7: Run full test suite and verify

**Step 1: Run all related specs**

Run: `bin/rspec spec/models/document_editing_session_spec.rb spec/channels/document_channel_spec.rb spec/requests/documents/versions_controller_spec.rb`
Expected: All PASS

**Step 2: Run the full test suite**

Run: `bin/rspec`
Expected: No regressions — all existing tests PASS

**Step 3: Final commit (if any fixups needed)**

If any tests needed adjustments, commit those fixes.
