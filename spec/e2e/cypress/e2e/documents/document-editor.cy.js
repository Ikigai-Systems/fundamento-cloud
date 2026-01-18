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

  it("creates a new document and updates its content", function () {
    // Navigate to the space
    cy.visit("/s/is_default");

    // Click the new document button (creates document and redirects to edit page)
    cy.get('[aria-label="Create new document"]').click();

    // Wait for the document to be created and redirected to edit page
    cy.url().should("match", editPageUrl);

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

  it("displays headers in the sidebar hierarchy tab and updates when document changes", function () {
    // Create a new document with headers
    cy.visit("/s/is_default");
    cy.get('[aria-label="Create new document"]').click();

    // Wait for redirect to edit page
    cy.url().should("match", editPageUrl);

    // Wait for editor to load
    cy.get("[data-document-editor]").should("exist");

    // Type the heading text
    cy.get("[data-document-editor] [role=\"textbox\"]").click();

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
    // Get existing document ID
    cy.appEval("Document.first.id").then((documentId) => {
      cy.visit(`/d/${documentId}`);

      // Wait for editor to load
      cy.get("[data-document-editor]").should("exist");

      // Get initial version count
      cy.appEval(`Document.find('${documentId}').versions.count`).then((initialVersionCount) => {
        // Make first edit
        cy.get("[data-document-editor] [role=\"textbox\"]").first().type("First version content.{enter}");

        // Save the document by clicking the update button
        cy.get('[aria-label="Save document"]').click();

        // Wait for save confirmation
        cy.contains("Document has been updated").should("be.visible");

        // Verify version was created
        cy.appEval(`Document.find('${documentId}').versions.count`).then((newCount) => {
          expect(newCount).to.equal(initialVersionCount + 1);
        });

        // Make second edit
        cy.get("[data-document-editor] [role=\"textbox\"]").last().type("Second version content.{enter}");

        // Save again
        cy.get('[aria-label="Save document"]').click();
        cy.contains("Document has been updated").should("be.visible");

        // Verify another version was created
        cy.appEval(`Document.find('${documentId}').versions.count`).then((finalCount) => {
          expect(finalCount).to.equal(initialVersionCount + 2);
        });

        // Make third edit
        cy.get("[data-document-editor] [role=\"textbox\"]").last().type("Third version content.");

        // Save again
        cy.get('[aria-label="Save document"]').click();
        cy.contains("Document has been updated").should("be.visible");

        // Verify third version was created
        cy.appEval(`Document.find('${documentId}').versions.count`).then((thirdCount) => {
          expect(thirdCount).to.equal(initialVersionCount + 3);
        });
      });
    });
  });
});
