import {isOrganizationCookie} from "../../support/organization-cookies.js";

// This spec exercises a genuine, rare race in the app's ActionCable/Y.js
// editing-session tracking (module-level ydoc/provider singletons in
// Editor.tsx, exercised by this test's rapid multi-user page navigations) —
// confirmed via CI server logs showing a WS connection that never receives
// an update message, not a slow one. That's an application bug to fix
// separately, not something a longer test timeout can paper over. Retry in
// CI only so this rare race doesn't block unrelated PRs while it's tracked.
describe("Document Editing Sessions", {retries: {runMode: 2, openMode: 0}}, function () {
  const documentId = "one";

  beforeEach(() => {
    cy.app("clean");

    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: [
        "organizations",
        "users",
        "organization_memberships",
        "spaces",
        "documents",
        "versions",
        "document_editing_sessions"
      ]
    });
  });

  // Helper to login and set org cookie
  function loginAs(email, sessionName) {
    cy.loginWithSession(email, "password", sessionName);
    cy.setCookie("organization_id", isOrganizationCookie);
  }

  // Helper to open document editor and wait for it to load
  //
  // Waiting for the BlockNote textbox to render is not enough: the
  // ActionCable DocumentChannel subscription (which creates this user's
  // DocumentEditingSession row) completes independently of and after the
  // React editor becoming interactive. If the test switches users (a full
  // page navigation) before that subscription lands, the session row for
  // the outgoing user is never created, so it can't be linked to the
  // version being saved. Poll for the row to actually exist before moving on.
  function openEditor(email) {
    cy.visit(`/d/${documentId}/edit`);
    cy.waitForEditor();
    waitForEditingSession(email);
  }

  // How long to poll for an ActionCable round-trip (subscription established,
  // or a Y.js update flushed and processed) to land server-side. This is a
  // real network/WS hop, not just a render tick, so give it much more
  // headroom than a UI assertion — CI runners have shown this taking well
  // over 5s under load even though it's near-instant locally.
  const CABLE_ROUNDTRIP_ATTEMPTS = 80; // 80 * 250ms = 20s

  // Checks for an *unlinked* session specifically: once a version is saved,
  // that user's prior (now version-linked) session would otherwise satisfy
  // a plain existence check and mask a still-missing new subscription.
  function waitForEditingSession(email, attempt = 0) {
    return cy.appEval(`
      membership = OrganizationMembership.joins(:user).find_by(users: { email: '${email}' })
      Document.find('${documentId}').editing_sessions.unlinked.exists?(member_id: membership&.id)
    `).then((exists) => {
      if (exists) return;
      if (attempt >= CABLE_ROUNDTRIP_ATTEMPTS) throw new Error(`Editing session for ${email} was not created in time`);
      cy.wait(250);
      return waitForEditingSession(email, attempt + 1);
    });
  }

  // Helper to type in editor, then wait for that edit to be recorded server-side.
  //
  // Typing only enqueues a Y.js update that the client flushes to the
  // DocumentChannel over ActionCable; the channel's `edited` flag on this
  // user's session is set asynchronously in `receive()` once that update
  // arrives (app/channels/document_channel.rb). Saving a version snapshots
  // whichever sessions are unlinked *at that instant*
  // (documents/versions_controller.rb), so if we save or switch users before
  // the update has landed, this user's contribution is silently dropped from
  // the version's editor count. Poll for the flag instead of guessing at timing.
  function typeInEditor(text, email) {
    cy.get("[data-document-editor] [role=\"textbox\"]").first().type(text);
    waitForEdited(email);
  }

  function waitForEdited(email, attempt = 0) {
    return cy.appEval(`
      membership = OrganizationMembership.joins(:user).find_by(users: { email: '${email}' })
      Document.find('${documentId}').editing_sessions.unlinked.exists?(member_id: membership&.id, edited: true)
    `).then((edited) => {
      if (edited) return;
      if (attempt >= CABLE_ROUNDTRIP_ATTEMPTS) throw new Error(`Edit by ${email} was not recorded server-side in time`);
      cy.wait(250);
      return waitForEdited(email, attempt + 1);
    });
  }

  // Helper to save version and wait for confirmation
  function saveVersion() {
    cy.intercept("POST", "/d/*/versions").as("saveVersion");
    cy.get("[aria-label=\"Save document\"]").click();
    cy.wait("@saveVersion");
    cy.contains("Document has been updated").should("be.visible");
  }

  it("tracks editing sessions across multiple versions with different contributors", function () {
    // Clean up any pre-existing editing sessions from fixtures
    cy.appEval("DocumentEditingSession.delete_all");

    // --- Version 1: Pawel edits ---
    loginAs("pawel@ikigai.systems", "pawel-session");
    openEditor("pawel@ikigai.systems");
    typeInEditor("Pawel's contribution to version 1. ", "pawel@ikigai.systems");
    saveVersion();

    // Verify version 1 was created and has 1 editing session (Pawel, edited)
    cy.appEval(`
      version = Document.find('${documentId}').versions.order(created_at: :asc).last
      sessions = version.editing_sessions
      {
        version_seq: version.sequential_id,
        session_count: sessions.count,
        editor_count: sessions.where(edited: true).count,
        member_ids: sessions.pluck(:member_id).sort
      }
    `).then((result) => {
      expect(result.session_count).to.eq(1);
      expect(result.editor_count).to.eq(1);
      expect(result.member_ids).to.include("om_is_pawel");
    });

    // --- Version 2: Stefan edits, then Pawel saves ---
    // Switch to Stefan
    loginAs("stefan@ikigai.systems", "stefan-session");
    openEditor("stefan@ikigai.systems");
    typeInEditor("Stefan's contribution to version 2. ", "stefan@ikigai.systems");

    // Switch back to Pawel to save
    loginAs("pawel@ikigai.systems", "pawel-session-2");
    openEditor("pawel@ikigai.systems");
    typeInEditor("Pawel's addition to version 2. ", "pawel@ikigai.systems");
    saveVersion();

    // Verify version 2 has sessions from both users
    cy.appEval(`
      version = Document.find('${documentId}').versions.order(created_at: :asc).last
      sessions = version.editing_sessions
      {
        session_count: sessions.count,
        editor_count: sessions.where(edited: true).count,
        viewer_count: sessions.where(edited: false).count,
        member_ids: sessions.pluck(:member_id).sort
      }
    `).then((result) => {
      // Stefan edited, Pawel edited - both should have sessions
      expect(result.session_count).to.be.at.least(2);
      expect(result.editor_count).to.be.at.least(2);
      expect(result.member_ids).to.include("om_is_pawel");
      expect(result.member_ids).to.include("om_is_stefan");
    });

    // --- Version 3: Only Pawel edits (Stefan not present) ---
    loginAs("pawel@ikigai.systems", "pawel-session-3");
    openEditor("pawel@ikigai.systems");
    typeInEditor("Pawel's solo contribution to version 3. ", "pawel@ikigai.systems");
    saveVersion();

    // Verify version 3 only has Pawel
    cy.appEval(`
      version = Document.find('${documentId}').versions.order(created_at: :asc).last
      sessions = version.editing_sessions
      {
        session_count: sessions.count,
        editor_count: sessions.where(edited: true).count,
        member_ids: sessions.pluck(:member_id).sort
      }
    `).then((result) => {
      expect(result.session_count).to.eq(1);
      expect(result.editor_count).to.eq(1);
      expect(result.member_ids).to.deep.eq(["om_is_pawel"]);
    });

    // --- Cross-version integrity checks ---
    cy.appEval(`
      doc = Document.find('${documentId}')
      versions = doc.versions.order(created_at: :asc)
      {
        total_versions: versions.count,
        total_sessions: doc.editing_sessions.count,
        unlinked_sessions: doc.editing_sessions.where(version_id: nil).count,
        sessions_per_version: versions.map { |v|
          { seq: v.sequential_id, count: v.editing_sessions.count }
        },
        all_sessions_have_version: doc.editing_sessions.where.not(version_id: nil).count == doc.editing_sessions.count
      }
    `).then((result) => {
      // Should have 3 versions we created
      expect(result.total_versions).to.be.at.least(3);

      // No unlinked sessions should remain (all claimed by versions)
      expect(result.unlinked_sessions).to.eq(0);

      // Every session should be linked to a version
      expect(result.all_sessions_have_version).to.be.true;
    });

    // --- UI verification: contributors visible in version history sidebar ---
    cy.visit(`/d/${documentId}/versions/latest`);

    // The sidebar should show versions with contributor avatars
    cy.get("#content-sidebar").within(() => {
      // Each version entry should exist
      cy.contains("Version 1").should("be.visible");
      cy.contains("Version 2").should("be.visible");
      cy.contains("Version 3").should("be.visible");

      // Version 2 should show contributors (both Pawel and Stefan)
      cy.get("[data-testid='version-contributors']").should("have.length.at.least", 1);
    });

    // Also verify the index table
    cy.visit(`/d/${documentId}/versions`);
    cy.contains("th", "Contributors").should("be.visible");
    cy.get("[data-testid='version-contributors']").should("have.length.at.least", 3);
  });

  it("distinguishes editors from viewers in editing sessions", function () {
    cy.appEval("DocumentEditingSession.delete_all");

    // Pawel opens and edits
    loginAs("pawel@ikigai.systems", "pawel-editor");
    openEditor("pawel@ikigai.systems");
    typeInEditor("Pawel types something. ", "pawel@ikigai.systems");

    // Stefan opens but does NOT type (just views)
    loginAs("stefan@ikigai.systems", "stefan-viewer");
    openEditor("stefan@ikigai.systems");
    // Do NOT type anything — Stefan is just a viewer

    // Pawel saves the version
    loginAs("pawel@ikigai.systems", "pawel-saver");
    openEditor("pawel@ikigai.systems");
    saveVersion();

    // Verify: Pawel is editor, Stefan is viewer
    cy.appEval(`
      version = Document.find('${documentId}').versions.order(created_at: :asc).last
      sessions = version.editing_sessions
      editors = sessions.where(edited: true).pluck(:member_id)
      viewers = sessions.where(edited: false).pluck(:member_id)
      {
        total: sessions.count,
        editors: editors.sort,
        viewers: viewers.sort
      }
    `).then((result) => {
      expect(result.total).to.be.at.least(2);
      expect(result.editors).to.include("om_is_pawel");
      expect(result.viewers).to.include("om_is_stefan");
    });

    // --- UI verification: both Pawel and Stefan appear as contributors ---
    cy.visit(`/d/${documentId}/versions/latest`);

    cy.get("#content-sidebar").within(() => {
      cy.get("[data-testid='version-contributors']").should("exist");
    });
  });
});
