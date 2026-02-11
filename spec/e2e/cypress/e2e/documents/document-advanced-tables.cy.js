import {isOrganizationCookie} from "../../support/organization-cookies.js";

const editPageUrl = /\/d\/[_\-a-zA-Z0-9]+\/edit$/;

describe("Advanced Table Title in Document", function () {
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
        "versions"
      ]
    });

    cy.loginWithSession("pawel@ikigai.systems", "password");
    cy.setCookie("organization_id", isOrganizationCookie);
  });

  function createDocumentAndInsertTable() {
    cy.visit("/s/is_default");
    cy.get('[aria-label="Create new document"]').click();

    cy.url().should("match", editPageUrl);
    cy.contains("Loading content").should("not.be.visible");
    cy.get("[data-document-editor]").should("exist");

    // Insert an advanced table via slash command
    cy.get("[data-document-editor] [role=\"textbox\"]").first().click();
    cy.focused().type("/table");

    cy.get(".bn-suggestion-menu").should("be.visible");
    cy.get(".bn-suggestion-menu-item").contains("Advanced table").click();

    // "New table" dialog should appear
    cy.contains("New table").should("be.visible");

    // Intercept the table creation request to capture the table ID
    cy.intercept("POST", "/t*").as("createTable");

    // Click "Start blank" to create a new table
    cy.contains("button", "Start blank").click();

    // Wait for table creation and extract the table ID
    return cy.wait("@createTable").then((interception) => {
      const tableId = interception.response.body.id;
      // Wait for the table to render
      cy.get(".advanced-table-title").should("exist");
      return cy.wrap(tableId);
    });
  }

  it("inserts a table into a document and displays its title", function () {
    createDocumentAndInsertTable().then((tableId) => {
      // Table title should show "Untitled" by default
      cy.get(".advanced-table-title").should("contain", "Table");

      // Table grid should be rendered
      cy.get("[role=\"gridcell\"]").should("have.length.at.least", 1);
    });
  });

  it("allows clicking the table title to edit it, saving on blur", function () {
    createDocumentAndInsertTable().then((tableId) => {
      cy.intercept("PATCH", `/t/${tableId}`).as("updateTableTitle");

      // Click to enter edit mode
      cy.get(".advanced-table-title.editable").click();

      // Input should appear and be focused
      cy.get(".advanced-table-title input").should("exist");
      cy.get(".advanced-table-title input").should("have.focus");

      // Type a new title
      cy.get(".advanced-table-title input").clear();
      cy.get(".advanced-table-title input").type("Project Tracker");

      // Blur to save
      cy.get(".advanced-table-title input").blur();

      // Wait for the PATCH request
      cy.wait("@updateTableTitle").then((interception) => {
        expect(interception.request.body.name).to.equal("Project Tracker");
      });

      // Should show updated title in view mode
      cy.get(".advanced-table-title").should("contain", "Project Tracker");
      cy.get(".advanced-table-title input").should("not.exist");
    });
  });

  it("saves table title on Enter key", function () {
    createDocumentAndInsertTable().then((tableId) => {
      cy.intercept("PATCH", `/t/${tableId}`).as("updateTableTitle");

      cy.get(".advanced-table-title.editable").click();
      cy.get(".advanced-table-title input").clear();
      cy.get(".advanced-table-title input").type("Saved With Enter{enter}");

      cy.wait("@updateTableTitle");

      cy.get(".advanced-table-title").should("contain", "Saved With Enter");
      cy.get(".advanced-table-title input").should("not.exist");
    });
  });

  it("cancels editing on Escape and restores original title", function () {
    createDocumentAndInsertTable().then((tableId) => {
      // First rename the table so we have a known title
      cy.intercept("PATCH", `/t/${tableId}`).as("updateTableTitle");

      cy.get(".advanced-table-title.editable").click();
      cy.get(".advanced-table-title input").clear();
      cy.get(".advanced-table-title input").type("Original Title");
      cy.get(".advanced-table-title input").blur();
      cy.wait("@updateTableTitle");

      cy.get(".advanced-table-title").should("contain", "Original Title");

      // Now try to edit and cancel with Escape
      cy.get(".advanced-table-title.editable").click();
      cy.get(".advanced-table-title input").clear();
      cy.get(".advanced-table-title input").type("Should Not Save");
      cy.get(".advanced-table-title input").type("{esc}");

      // Should revert to original title
      cy.get(".advanced-table-title").should("contain", "Original Title");
      cy.get(".advanced-table-title input").should("not.exist");
    });
  });

  it("saves as Untitled when title is cleared", function () {
    createDocumentAndInsertTable().then((tableId) => {
      // First set a title
      cy.intercept("PATCH", `/t/${tableId}`).as("updateTableTitle");

      cy.get(".advanced-table-title.editable").click();
      cy.get(".advanced-table-title input").clear();
      cy.get(".advanced-table-title input").type("Temporary Title");
      cy.get(".advanced-table-title input").blur();
      cy.wait("@updateTableTitle");

      // Now clear the title
      cy.get(".advanced-table-title.editable").click();
      cy.get(".advanced-table-title input").clear();
      cy.get(".advanced-table-title input").blur();

      cy.wait("@updateTableTitle").then((interception) => {
        expect(interception.request.body.name).to.equal("Untitled");
      });

      cy.get(".advanced-table-title").should("contain", "Untitled");
    });
  });

  it("persists table title after saving and reloading the document", function () {
    createDocumentAndInsertTable().then((tableId) => {
      cy.intercept("PATCH", `/t/${tableId}`).as("updateTableTitle");

      // Edit the table title
      cy.get(".advanced-table-title.editable").click();
      cy.get(".advanced-table-title input").clear();
      cy.get(".advanced-table-title input").type("Persisted Title");
      cy.get(".advanced-table-title input").blur();
      cy.wait("@updateTableTitle");

      // Save the document
      cy.get('[aria-label="Save document"]').click();
      cy.contains("Document has been updated").should("be.visible");

      // Reload the page
      cy.reload();

      cy.contains("Loading content").should("not.be.visible");
      cy.get("[data-document-editor]").should("exist");

      // Verify the table title persists
      cy.get(".advanced-table-title").should("contain", "Persisted Title");
    });
  });

  it("does not show editable title in read-only mode", function () {
    createDocumentAndInsertTable().then(() => {
      // Save the document first
      cy.get('[aria-label="Save document"]').click();
      cy.contains("Document has been updated").should("be.visible");

      // Navigate to the read-only view by extracting the document URL
      cy.url().then((url) => {
        const documentId = url.match(/\/d\/([^/]+)/)[1];
        cy.visit(`/d/${documentId}`);
      });

      cy.contains("Loading content").should("not.be.visible");
      cy.get("[data-document-editor]").should("exist");

      // Table title should be visible but not editable
      cy.get(".advanced-table-title").should("exist");
      cy.get(".advanced-table-title.editable").should("not.exist");
    });
  });
});
