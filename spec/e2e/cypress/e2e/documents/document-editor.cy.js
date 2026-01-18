import {isOrganizationCookie} from "../../support/organization-cookies.js";

describe("Document Editor", function () {
  beforeEach(() => {
    cy.app("clean");

    // Load fixtures
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: [
        "organizations",
        "users",
        "organization_memberships",
        "spaces",
        "documents",
        "versions"
      ]
    });

    cy.loginWithSession("pawel@ikigai.systems", "password");

    cy.setCookie("organization_id", isOrganizationCookie);
  });

  it("creates a new document and updates its content", function () {
    // Navigate to the space
    cy.visit("/s/is_default");

    // Click the new document button (creates document and redirects to edit page)
    cy.get('[aria-label="Create new document"]').click();

    // Wait for the document to be created and redirected to edit page
    cy.url().should("match", /\/d\/[a-zA-Z0-9]+\/edit$/);

    // Verify the editor is loaded
    cy.get("[data-document-editor]").should("exist");

    // Wait for editor to fully initialize
    cy.wait(1000);

    // Update the document title
    cy.get('input.content-title-input').clear().type("Test Document for Editor");
    cy.wait(500); // Wait for autosave

    // Type content in the editor
    cy.get("[data-document-editor] [role=\"textbox\"]").first().click().type("This is the first paragraph of the test document.");

    // Press Enter to create a new paragraph
    cy.get("[data-document-editor] [role=\"textbox\"]").first().type("{enter}");

    // Type more content
    cy.get("[data-document-editor] [role=\"textbox\"]").last().type("This is the second paragraph.");

    // Verify content is visible
    cy.contains("This is the first paragraph of the test document.").should("be.visible");
    cy.contains("This is the second paragraph.").should("be.visible");

    // Verify multiple blocks are created
    cy.get("[data-document-editor] .bn-block-outer").should("have.length.at.least", 2);
  });

});
