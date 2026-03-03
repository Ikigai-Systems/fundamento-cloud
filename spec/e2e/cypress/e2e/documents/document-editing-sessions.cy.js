import {isOrganizationCookie} from "../../support/organization-cookies.js";

describe("Document Editing Sessions", function () {
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
  function openEditor() {
    cy.visit(`/d/${documentId}/edit`);
    cy.contains("Loading content").should("not.be.visible");
    cy.get("[data-document-editor]").should("exist");
  }

  // Helper to type in editor
  function typeInEditor(text) {
    cy.get("[data-document-editor] [role=\"textbox\"]").first().type(text);
  }

  // Helper to save version and wait for confirmation
  function saveVersion() {
    cy.get("[aria-label=\"Save document\"]").click();
    cy.contains("Document has been updated").should("be.visible");
  }

  it("tracks editing sessions across multiple versions with different contributors", function () {
    // Clean up any pre-existing editing sessions from fixtures
    cy.appEval("DocumentEditingSession.delete_all");

    // --- Version 1: Pawel edits ---
    loginAs("pawel@ikigai.systems", "pawel-session");
    openEditor();
    typeInEditor("Pawel's contribution to version 1. ");
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
    openEditor();
    typeInEditor("Stefan's contribution to version 2. ");

    // Switch back to Pawel to save
    loginAs("pawel@ikigai.systems", "pawel-session-2");
    openEditor();
    typeInEditor("Pawel's addition to version 2. ");
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
    openEditor();
    typeInEditor("Pawel's solo contribution to version 3. ");
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
  });

  it("distinguishes editors from viewers in editing sessions", function () {
    cy.appEval("DocumentEditingSession.delete_all");

    // Pawel opens and edits
    loginAs("pawel@ikigai.systems", "pawel-editor");
    openEditor();
    typeInEditor("Pawel types something. ");

    // Stefan opens but does NOT type (just views)
    loginAs("stefan@ikigai.systems", "stefan-viewer");
    openEditor();
    // Do NOT type anything — Stefan is just a viewer

    // Pawel saves the version
    loginAs("pawel@ikigai.systems", "pawel-saver");
    openEditor();
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
  });
});
