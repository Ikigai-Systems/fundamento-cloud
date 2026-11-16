import {isOrganizationCookie} from "../../support/organization-cookies.js";

// An edit made through the API or MCP reaches the server as a Yjs update, which has to merge
// with the editor someone has open. Replacing the stored state instead left that editor holding
// one that no longer matched, and the next thing typed undid the change.
describe("Document updated from the server while it is open", function () {
  const CABLE_ROUNDTRIP_ATTEMPTS = 80; // 80 * 250ms = 20s, as in document-editing-sessions.cy.js

  let documentId;

  beforeEach(() => {
    cy.app("clean");

    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: ["organizations", "users", "organization_memberships", "spaces"],
    });

    cy.loginWithSession("pawel@ikigai.systems", "password");
    cy.setCookie("organization_id", isOrganizationCookie);

    cy.appEval(`
      user = User.find_by!(email: "pawel@ikigai.systems")
      organization = Organization.find_by!(name: "Ikigai Systems")
      space = organization.spaces.first
      document = DocumentService.new(pundit_user: PolicyUserContext.new(user, organization))
        .create!(space_id: space.id, title: "Server updates", markdown: "# Title\\n\\nFirst paragraph\\n\\nSecond paragraph\\n")
      document.id
    `).then((id) => {
      documentId = id;
      cy.visit(`/d/${id}/edit`);
    });

    cy.waitForEditor();
  });

  // The markdown an API client would send back: the document as read with block ids, with one
  // paragraph changed, so the blocks keep their ids and only that one differs.
  //
  // The client read what the editor shows. A reader of a document that has a saved version gets
  // that version, which lacks what is being typed, and an update built from it replaces the
  // typing like any replacement of the whole content does. That is not a merge problem.
  function updateThroughTheApi(from, to) {
    cy.appEval(`
      user = User.find_by!(email: "pawel@ikigai.systems")
      organization = Organization.find_by!(name: "Ikigai Systems")
      document = organization.documents.find("${documentId}")
      markdown = BlocknoteConverterService.blocks_to_markdown(document.to_blocks, block_ids: :all)
      DocumentService.new(pundit_user: PolicyUserContext.new(user, organization))
        .update!(document_id: document.id, markdown: markdown.sub("${from}", "${to}"))
      true
    `);
  }

  // The editor's changes reach the stored state through the channel, a round trip of its own.
  function storedTextIncludes(text, attempt = 0) {
    return cy.appEval(`Document.find("${documentId}").to_blocks.to_json`).then((json) => {
      if (json.includes(text)) return;
      if (attempt >= CABLE_ROUNDTRIP_ATTEMPTS) throw new Error(`"${text}" was not stored in time`);
      cy.wait(250);
      return storedTextIncludes(text, attempt + 1);
    });
  }

  it("shows the change in the open editor without a reload", function () {
    updateThroughTheApi("Second paragraph", "Second paragraph, changed by the API");

    cy.get("[data-document-editor]").contains("Second paragraph, changed by the API", {timeout: 10000});
    cy.get("[data-document-editor]").contains("First paragraph");
  });

  it("keeps the change when the person types afterwards", function () {
    updateThroughTheApi("Second paragraph", "Second paragraph, changed by the API");
    cy.get("[data-document-editor]").contains("Second paragraph, changed by the API", {timeout: 10000});

    cy.get("[data-document-editor]").contains("First paragraph").click().type("{end} and typed");
    storedTextIncludes("First paragraph and typed");

    cy.reload();
    cy.waitForEditor();

    cy.get("[data-document-editor]").contains("First paragraph and typed");
    cy.get("[data-document-editor]").contains("Second paragraph, changed by the API");
  });

  it("keeps what the person typed when the API changes another paragraph", function () {
    cy.get("[data-document-editor]").contains("First paragraph").click().type("{end} and typed");
    storedTextIncludes("First paragraph and typed");

    updateThroughTheApi("Second paragraph", "Second paragraph, changed by the API");

    cy.get("[data-document-editor]").contains("Second paragraph, changed by the API", {timeout: 10000});
    cy.get("[data-document-editor]").contains("First paragraph and typed");
  });
});
