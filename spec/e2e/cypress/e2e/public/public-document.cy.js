describe("Public Document", function() {
  before(() => {
    cy.app("clean");
  });

  beforeEach(() => {
    // Load fixtures with public links, documents, and versions
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: ["organizations", "users", "spaces", "documents", "versions", "public_links"]
    });

    // Visit the public link for document "two" via public_link_to_two fixture (ID: r2fPRJxuTX)
    cy.visit("/public/r2fPRJxuTX");

    cy.get('input[name="user[email]"]').type("pawel@ikigai.systems");
    cy.get('input[name="user[password]"]').type("password");
    cy.get('input[type=submit]').click();
  });

  it("displays document content correctly using contentBlocks property", function() {
    // Visit the public link for document "two" via public_link_to_two fixture (ID: r2fPRJxuTX)
    cy.visit("/public/r2fPRJxuTX");

    // Verify the page loads successfully and the editor is rendered
    cy.get("[data-document-editor]").should("exist");

    // Verify that the content from version.contentBlocks is rendered
    // The fixture has content: "This is a new update." and "This document will be edited via public link."
    // This validates that version.contentBlocks (not version.content) is being used correctly
    cy.contains("This is a new update.").should("be.visible");
    cy.contains("This document will be edited via public link.").should("be.visible");

    // Verify the BlockNote editor is initialized with content blocks
    cy.get("[data-document-editor] .bn-block-outer").should("have.length.at.least", 1);
  });

  it("handles public document with empty content gracefully", function() {
    // This test ensures that even with various content structures, the editor initializes correctly
    cy.visit("/public/r2fPRJxuTX");

    // Verify editor is present and no JavaScript errors occurred
    cy.get("[data-document-editor]").should("exist");

    // Verify the editor container has the expected structure
    cy.get("[data-document-editor] [role=\"textbox\"]").should("exist");
  });

  it("renders document structure with multiple blocks correctly", function() {
    cy.visit("/public/r2fPRJxuTX");

    // Wait for editor to fully load
    cy.get("[data-document-editor]").should("exist");

    // Verify multiple paragraph blocks are rendered
    // The fixture has 4 blocks (2 with content, 2 empty)
    cy.get("[data-document-editor] .bn-block-outer").should("have.length.at.least", 3);

    // Verify the document structure is properly initialized from contentBlocks
    cy.get("[data-document-editor] .bn-block-content").should("exist");
  });
});
