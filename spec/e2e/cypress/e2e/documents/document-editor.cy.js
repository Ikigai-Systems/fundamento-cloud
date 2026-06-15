import {isOrganizationCookie} from "../../support/organization-cookies.js";

const editPageUrl = /\/d\/[_\-a-zA-Z0-9]+\/edit$/;

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

  // Helper: click Save and wait for the POST to complete. Required because the
  // save now does a Turbo Frame swap (not a full page reload), so cy.contains
  // on the success flash can match a stale "Document has been updated." from a
  // previous save and let subsequent DB assertions race the in-flight POST.
  function saveDocument() {
    cy.intercept("POST", "/d/*/versions").as("saveVersion");
    cy.get('[aria-label="Save document"]').click();
    cy.wait("@saveVersion");
  }

  it("creates a new document and updates its content", function () {
    // Navigate to the space
    cy.visit("/s/is_default");

    // Click the new document button (creates document and redirects to edit page)
    cy.get('[aria-label="Create new document"]').click();

    // Wait for the document to be created and redirected to edit page
    cy.url().should("match", editPageUrl);

    // Verify the editor is loaded
    cy.waitForEditor();

    // Type content in the editor
    cy.get("[data-document-editor] [role='textbox']").first().type("This is the first paragraph of the test document.");

    // Press Enter to create a new paragraph
    cy.get("[data-document-editor] [role='textbox']").first().type("{enter}");

    // Type more content
    cy.get("[data-document-editor] [role='textbox']").last().type("This is the second paragraph.");

    // Verify content is visible
    cy.contains("This is the first paragraph of the test document.").should("be.visible");
    cy.contains("This is the second paragraph.").should("be.visible");

    // Verify multiple blocks are created
    cy.get("[data-document-editor] .bn-block-outer").should("have.length.at.least", 2);
  });

  it("displays headers in the sidebar hierarchy tab and updates when document changes", function () {
    // Create a new document with headers
    cy.visit("/s/is_default");
    cy.get('[aria-label="Create new document"]').click();

    // Wait for redirect to edit page
    cy.url().should("match", editPageUrl);

    // Wait for editor to load
    cy.waitForEditor();

    // Type the heading text
    cy.get("[data-document-editor] [role='textbox']").click();

    cy.focused().type("# First Heading{enter}");
    cy.focused().type("## Second Heading{enter}");
    cy.focused().type("Some content under the second heading.");

    // Verify headings are visible in the editor
    cy.contains("First Heading").should("be.visible");
    cy.contains("Second Heading").should("be.visible");

    cy.get("#content-sidebar").within(() => {
      cy.get('[aria-label="Structure"]').click();
    });

    // Verify headers appear in the hierarchy
    cy.get('#table_of_contents_sidebar_tab').within(() => {
      cy.contains("First Heading").should("be.visible");
      cy.contains("Second Heading").should("be.visible");
    });

    // Update a heading
    cy.contains("First Heading").click();
    cy.focused().type("{selectall}Updated First Heading");

    // Verify the hierarchy updates
    cy.get('#table_of_contents_sidebar_tab').within(() => {
      cy.contains("Updated First Heading").should("be.visible");
      cy.contains("Second Heading").should("not.exist");
    });
  });

  it("saves multiple versions correctly and displays them in version history", function () {
    const documentId = "one";

    cy.visit(`/d/${documentId}`);

    // Wait for editor to load
    cy.waitForEditor();

    // Get initial version count
    cy.appEval(`Document.find('${documentId}').versions.count`).then((initialVersionCount) => {
      // Make first edit
      cy.get("[data-document-editor] [role='textbox']").first().type("First version content.{enter}");

      // Save the document by clicking the update button
      saveDocument();

      // Verify version was created
      cy.appEval(`Document.find('${documentId}').versions.count`).then((newCount) => {
        expect(newCount).to.equal(initialVersionCount + 1);
      });

      cy.get('[aria-label="Edit document"]').click();

      // Make second edit
      cy.url().should("include", `/d/${documentId}/edit`);
      cy.waitForEditor();
      cy.get("[data-document-editor] [role='textbox']").first().type("Second version content.{enter}");

      // Save again
      saveDocument();

      // Verify another version was created
      cy.appEval(`Document.find('${documentId}').versions.count`).then((finalCount) => {
        expect(finalCount).to.equal(initialVersionCount + 2);
      });

      // Make third edit
      cy.get('[aria-label="Edit document"]').click();

      cy.url().should("include", `/d/${documentId}/edit`);
      cy.waitForEditor();
      cy.get("[data-document-editor] [role='textbox']").first().type("Third version content.");

      // Save again
      saveDocument();

      // Verify third version was created
      cy.appEval(`Document.find('${documentId}').versions.count`).then((thirdCount) => {
        expect(thirdCount).to.equal(initialVersionCount + 3);
      });

      // Verify contributors appear in sidebar details
      cy.get("#content-sidebar").within(() => {
        cy.get('[aria-label="Details"]').click();
      });

      cy.get("[data-testid='user-avatars-group']").should("exist");
    });
  });

  it("displays version history and allows viewing specific versions", function () {
    const documentId = "two";

    // Assert one version is already in the database (Version 1)
    cy.appEval(`Document.find('${documentId}').versions.count`).then((versionCount) => {
      expect(versionCount).to.be.equal(1);
    });

    cy.visit(`/d/${documentId}/edit`);

    // Wait for editor to load
    cy.waitForEditor();

    // Make first edit and save
    cy.get("[data-document-editor] [role='textbox']").first().type("{selectall}Version 2 content.{enter}");
    saveDocument();
    cy.get('[aria-label="Edit document"]').click();

    // Make second edit and save
    cy.url().should("include", `/d/${documentId}/edit`);
    cy.waitForEditor();
    cy.get("[data-document-editor] [role='textbox']").first().type("{selectall}Version 3 content.{enter}");
    saveDocument();
    cy.get('[aria-label="Edit document"]').click();

    // Make third edit and save
    cy.url().should("include", `/d/${documentId}/edit`);
    cy.waitForEditor();
    cy.get("[data-document-editor] [role='textbox']").first().type("{selectall}Version 4 content.{enter}");
    saveDocument();

    // Navigate to versions page
    cy.visit(`/d/${documentId}/versions`);

    // Verify we're on the versions page
    cy.url().should("include", "/versions");
    cy.contains("Versions").should("be.visible");

    // Verify the versions table has a Contributors column
    cy.contains("th", "Contributors").should("be.visible");

    // Each version row should have a contributors cell
    cy.get("[data-testid='version-contributors']").should("have.length.at.least", 1);

    // Verify versions are listed (should have at least 3 versions)
    cy.get("tr").should("have.length.at.least", 4); // header row + 3 versions

    // Get the version IDs
    cy.appEval(`Document.find('${documentId}').versions.order('created_at DESC').pluck(:sequential_id)`).then((versionIds) => {
      expect(versionIds.length).to.be.at.least(3);

      // View the first version (most recent)
      cy.visit(`/d/${documentId}/versions/${versionIds[0]}`);

      // Verify the editor is in read-only mode
      cy.get("[data-document-editor]").should("exist");

      // Verify contributor avatars appear in the sidebar
      cy.get("#content-sidebar").within(() => {
        cy.get("[data-testid='version-contributors']").should("exist");
      });

      // Verify content contains version 3 content
      cy.contains("Version 4 content.").should("be.visible");
      cy.contains("Version 3 content.").should("not.exist");
      cy.contains("Version 2 content.").should("not.exist");

      cy.get("#content-sidebar").within(() => {
        cy.contains("Version 3").click();
        cy.url().should("include", `/d/${documentId}/versions/${versionIds[1]}`);
      })

      cy.contains("Version 4 content.").should("not.exist");
      cy.contains("Version 3 content.").should("be.visible");
      cy.contains("Version 2 content.").should("not.exist");

      cy.get("#content-sidebar").within(() => {
        cy.contains("Version 2").click();
        cy.url().should("include", `/d/${documentId}/versions/${versionIds[2]}`);
      })

      cy.contains("Version 4 content.").should("not.exist");
      cy.contains("Version 3 content.").should("not.exist");
      cy.contains("Version 2 content.").should("be.visible");
    });
  });

  it("persists document content after reload", function () {
    // Get existing document ID
    cy.appEval("Document.first.id").then((documentId) => {
      cy.visit(`/d/${documentId}/edit`);

      // Wait for editor to load
      cy.get("[data-document-editor]").should("exist");

      // Add unique content
      const uniqueContent = `Unique content ${Date.now()}`;
      cy.get("[data-document-editor] [role='textbox']").first().clear();
      cy.get("[data-document-editor] [role='textbox']").first().type(uniqueContent);

      // Save the document
      saveDocument();

      // Reload the page
      cy.reload();

      // Wait for editor to load again
      cy.waitForEditor();

      // Verify content persists
      cy.contains(uniqueContent).should("be.visible");
    });
  });

  it("allows keyboard shortcut for saving document (CMD+Enter or CTRL+Enter)", function () {
    // Get existing document ID
    cy.appEval("Document.first.id").then((documentId) => {
      cy.visit(`/d/${documentId}/edit`);

      // Wait for editor to load
      cy.waitForEditor();

      // Get initial version count
      cy.appEval(`Document.find('${documentId}').versions.count`).then((initialCount) => {
        cy.intercept("POST", `/d/${documentId}/versions`).as("saveVersion");

        // Add content
        cy.get("[data-document-editor] [role='textbox']").first().type("{selectall}Keyboard shortcut test content.{ctrl+enter}");

        // Use keyboard shortcut to save (CTRL+Enter works on all platforms in Cypress)
        cy.document().trigger('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          ctrlKey: true,
          bubbles: true
        });

        // Wait for the POST to complete before asserting DB state.
        cy.wait("@saveVersion");

        cy.url().should("include", `/d/${documentId}`);

        // Verify version was created
        cy.appEval(`Document.find('${documentId}').versions.count`).then((newCount) => {
          expect(newCount).to.equal(initialCount + 1);
        });
      });
    });
  });

  it("handles empty document gracefully", function () {
    // Create a new empty document
    cy.visit("/s/is_default");
    cy.get('[aria-label="Create new document"]').click();

    // Wait for redirect to edit page
    cy.url().should("match", editPageUrl);

    // Wait for editor to load
    cy.waitForEditor();

    // Verify editor is present with empty content
    cy.get("[data-document-editor] [role='textbox']").should("exist");

    // Verify at least one empty block exists
    cy.get("[data-document-editor] .bn-block-outer").should("have.length.at.least", 1);

    // Save empty document
    saveDocument();
  });

  it("allows editing document title inline", function () {
    // Get existing document ID
    cy.appEval("Document.first.id").then((documentId) => {
      cy.intercept("PATCH", `/d/${documentId}`).as("updateDocument");

      cy.visit(`/d/${documentId}/edit`);

      // Wait for editor to load
      cy.waitForEditor();

      // Find and edit the title
      const newTitle = `Updated Title ${Date.now()}`;
      // Update the document title
      cy.get("nav .editable-content-title.editable").click();
      cy.get("nav .editable-content-title input").clear();
      cy.get("nav .editable-content-title input").type(newTitle);
      cy.get("nav .editable-content-title input").blur();

      // Wait for auto-save (if implemented) or reload
      cy.wait("@updateDocument");
      cy.reload();

      // Verify title persists
      cy.get('nav .editable-content-title').should("contain", newTitle);
    });
  });

  it("supports using slash commands when editing", function () {
    // Create a new document with various block types
    cy.visit("/s/is_default");
    cy.get('[aria-label="Create new document"]').click();

    // Wait for redirect to edit page
    cy.url().should("match", editPageUrl);

    // Wait for editor to load
    cy.waitForEditor();

    // Extract document ID from URL to intercept the exact PATCH request
    cy.url().then((url) => {
      const documentId = url.match(/\/d\/([^/]+)/)[1];
      cy.intercept("PATCH", `/d/${documentId}`).as("updateDocument");
    });

    // Update title
    const documentTitle = "Multi-Block Document";
    cy.get("nav .editable-content-title.editable").click();
    cy.get("nav .editable-content-title input").clear();
    cy.get("nav .editable-content-title input").type(documentTitle);
    cy.get("nav .editable-content-title input").blur();

    cy.wait("@updateDocument");

    // Click into the editor
    cy.get("[data-document-editor] [role='textbox']").first().click();

    // Add a heading using slash command
    cy.focused().type("/heading");

    // Wait for slash menu to appear
    cy.get('.bn-suggestion-menu').should('be.visible');

    // Click "Heading 1" from the menu
    cy.get('.bn-suggestion-menu-item').contains('Heading 1').click();

    // Type the heading text
    cy.focused().type("Main Heading{enter}");

    // Add a paragraph
    cy.focused().type("This is a paragraph.{enter}");

    // Add a bullet list using slash command
    cy.focused().type("/bullet");

    // Wait for menu
    cy.get('.bn-suggestion-menu').should('be.visible');

    // Click "Bullet List" from the menu
    cy.get('.bn-suggestion-menu-item').contains('Bullet List').click();

    // Type list items
    cy.focused().type("First bullet{enter}");
    cy.focused().type("Second bullet{enter}");

    // Exit the list (double enter)
    cy.focused().type("{enter}");

    // Add another paragraph
    cy.focused().type("Final paragraph.");

    // Verify all content is visible
    cy.contains("Main Heading").should("be.visible");
    cy.contains("This is a paragraph.").should("be.visible");
    cy.contains("First bullet").should("be.visible");
    cy.contains("Second bullet").should("be.visible");
    cy.contains("Final paragraph.").should("be.visible");

    // Verify multiple blocks are created
    cy.get("[data-document-editor] .bn-block-outer").should("have.length.at.least", 5);

    // Save the document
    saveDocument();

    // Reload and verify structure persists
    cy.contains(documentTitle).should("be.visible");
    cy.get("[data-document-editor]").should("exist");
    cy.contains("Main Heading").should("be.visible");
    cy.contains("First bullet").should("be.visible");
    cy.get("[data-document-editor] .bn-block-outer").should("have.length.at.least", 5);
  });
});
