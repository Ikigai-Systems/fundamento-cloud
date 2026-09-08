import {isOrganizationCookie} from "../../support/organization-cookies.js";

// Attachments are addressed in stored content as `attachment:<id>` and resolved to a real
// endpoint only when rendered, so the same document can be served through the
// authenticated route or the public one. That resolution happens in a ProseMirror mark
// view, which exists only in a real browser -- no unit test can reach it.
//
// The other half is that widening BlockNote's scheme allowlist must not disturb ordinary
// links, and that neither the resolved path nor a dropped href may leak back into storage
// when the document is saved.
describe("Attachment links in documents", function () {
  const documentId = "two";

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
        "public_links"
      ]
    });

    cy.loginWithSession("pawel@ikigai.systems", "password");
    cy.setCookie("organization_id", isOrganizationCookie);
  });

  // A paragraph holding an internal attachment link and an external link side by side,
  // written to both the saved version and the live Y.js body the editor loads.
  function seedDocument() {
    return cy.appEval(`
      document = Document.find('${documentId}')
      attachment = document.attachments.create!(
        organization: document.organization, filename: "photo.png", mime_type: "image/png"
      )
      blocks = [{
        "id" => "para-1", "type" => "paragraph", "props" => {}, "children" => [],
        "content" => [
          {"type" => "text", "text" => "see ", "styles" => {}},
          {"type" => "link", "href" => "attachment:#{attachment.id}",
           "content" => [{"type" => "text", "text" => "the photo", "styles" => {}}]},
          {"type" => "text", "text" => " and ", "styles" => {}},
          {"type" => "link", "href" => "https://example.com/docs",
           "content" => [{"type" => "text", "text" => "example site", "styles" => {}}]}
        ]
      }]
      document.versions.create!(content_blocks: blocks)
      document.update!(sync: BlocknoteConverterService.blocks_to_yjs(blocks))
      attachment.id
    `);
  }

  function saveDocument() {
    cy.intercept("POST", "/d/*/versions").as("saveVersion");
    cy.get('[aria-label="Save document"]').click();
    cy.wait("@saveVersion");
  }

  it("keeps the internal form in the editable editor's href", function () {
    // In the editable editor the href stays attachment:<id> and is resolved only when
    // followed. It must not be rewritten during rendering there: this editor's blocks are
    // posted back verbatim on save, so a resolved path would be persisted.
    seedDocument().then((attachmentId) => {
      cy.visit(`/d/${documentId}/edit`);
      cy.waitForEditor();

      cy.get(`[data-document-editor] a[href="attachment:${attachmentId}"]`)
        .should("contain", "the photo");
    });
  });

  it("opens an attachment link against the authenticated route", function () {
    // BlockNote's link click handler bails on a non-editable view, so this only applies
    // to the editable editor. Read-only viewers resolve at load instead.
    seedDocument().then((attachmentId) => {
      cy.visit(`/d/${documentId}/edit`);
      cy.waitForEditor();

      cy.window().then((win) => cy.stub(win, "open").as("openTab"));
      cy.get(`[data-document-editor] a[href="attachment:${attachmentId}"]`).click();

      cy.get("@openTab").should("have.been.calledWithMatch", `/attachments/${attachmentId}`);
    });
  });

  it("leaves an external link untouched", function () {
    seedDocument().then(() => {
      cy.visit(`/d/${documentId}`);
      cy.waitForEditor();

      cy.get('[data-document-editor] a[href="https://example.com/docs"]')
        .should("contain", "example site");
    });
  });

  it("stores the internal form after a save, not the rendered path", function () {
    // versions#create posts the editor's own block state, so a mark view that leaked into
    // the document rather than only the view would be written straight back to the DB.
    seedDocument().then((attachmentId) => {
      cy.visit(`/d/${documentId}/edit`);
      cy.waitForEditor();
      saveDocument();

      cy.appEval(`Document.find('${documentId}').versions.last.content_blocks.to_json`)
        .then((json) => {
          expect(json).to.contain(`attachment:${attachmentId}`);
          expect(json).not.to.contain(`/attachments/${attachmentId}`);
          expect(json).to.contain("https://example.com/docs");
        });
    });
  });

  it("keeps both links after an edit", function () {
    seedDocument().then((attachmentId) => {
      cy.visit(`/d/${documentId}/edit`);
      cy.waitForEditor();

      cy.get("[data-document-editor] [role='textbox']").first().type("{moveToEnd} trailing text");
      saveDocument();

      cy.appEval(`Document.find('${documentId}').versions.last.content_blocks.to_json`)
        .then((json) => {
          expect(json).to.contain(`attachment:${attachmentId}`);
          expect(json).to.contain("https://example.com/docs");
          expect(json).to.contain("trailing text");
        });
    });
  });

  it("renders the attachment link against the public route when shared", function () {
    // Same stored content, different endpoint -- the point of not storing a path.
    seedDocument().then((attachmentId) => {
      cy.visit("/public/r2fPRJxuTX");

      // Read-only, so the href is resolved when the content is handed to the viewer --
      // safe because nothing is ever written back from here.
      cy.get(`a[href="/public/attachments/${attachmentId}"]`, {timeout: 10000})
        .should("contain", "the photo");
      cy.get('a[href="https://example.com/docs"]').should("exist");
    });
  });
});
