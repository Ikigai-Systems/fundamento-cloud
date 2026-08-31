import {isOrganizationCookie} from "../../support/organization-cookies.js";

describe("Editable Content Title", function () {
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
        "tables/tables",
        "tables/columns",
        "tables/rows",
        "tables/cells"
      ]
    });

    cy.loginWithSession("pawel@ikigai.systems", "password");
    cy.setCookie("organization_id", isOrganizationCookie);
  });

  describe("Document show page", function () {
    it("displays the document title in the nav bar", function () {
      cy.appEval("Document.find_by(title: 'One').id").then((docId) => {
        cy.visit(`/d/${docId}`);
        cy.get("nav .editable-content-title").should("contain", "One");
      });
    });

    it("allows clicking the title to edit, saving on blur", function () {
      cy.appEval("Document.find_by(title: 'One').id").then((docId) => {
        cy.visit(`/d/${docId}`);

        // Click to enter edit mode
        cy.get("nav .editable-content-title.editable").click();

        // Input should appear and be focused
        cy.get("nav .editable-content-title input").should("exist");
        cy.get("nav .editable-content-title input").should("have.focus");

        // Clear and type new title
        cy.get("nav .editable-content-title input").clear();
        cy.get("nav .editable-content-title input").type("Renamed Document");

        // Blur to save
        cy.get("nav .editable-content-title input").blur();

        // Should show updated title in view mode
        cy.get("nav .editable-content-title").should("contain", "Renamed Document");
        cy.get("nav .editable-content-title input").should("not.exist");

        // Verify the sidebar is updated
        cy.get(`[data-document-id="${docId}"] span.truncate`).should("contain", "Renamed Document");
      });
    });

    it("cancels editing on Escape and restores original title", function () {
      cy.appEval("Document.find_by(title: 'One').id").then((docId) => {
        cy.visit(`/d/${docId}`);

        cy.get("nav .editable-content-title.editable").click();
        cy.get("nav .editable-content-title input").clear();
        cy.get("nav .editable-content-title input").type("Should Not Save");
        cy.get("nav .editable-content-title input").type("{esc}");

        // Should revert to original title
        cy.get("nav .editable-content-title").should("contain", "One");
        cy.get("nav .editable-content-title input").should("not.exist");
      });
    });
  });

  describe("Document edit page", function () {
    it("displays an editable title in the nav bar", function () {
      cy.appEval("Document.find_by(title: 'One').id").then((docId) => {
        cy.visit(`/d/${docId}/edit`);

        cy.waitForEditor();

        cy.get("nav .editable-content-title.editable").should("contain", "One");

        // Click to edit
        cy.get("nav .editable-content-title.editable").click();
        cy.get("nav .editable-content-title input").should("exist");
      });
    });
  });

  describe("Table show page", function () {
    it("displays the table title in the nav bar", function () {
      cy.appEval("Table.find(:projects).id").then((tableId) => {
        cy.visit(`/t/${tableId}`);
        cy.get("nav .editable-content-title").should("contain", "Projects");
      });
    });

    it("allows clicking the title to edit, saving on blur, and updates sidebar", function () {
      cy.appEval("Table.find(:projects).id").then((tableId) => {
        cy.visit(`/t/${tableId}`);

        // Click to enter edit mode
        cy.get("nav .editable-content-title.editable").click();
        cy.get("nav .editable-content-title input").should("exist");

        // Clear and type new name
        cy.get("nav .editable-content-title input").clear();
        cy.get("nav .editable-content-title input").type("Renamed Table");
        cy.get("nav .editable-content-title input").blur();

        // Should show updated title in view mode
        cy.get("nav .editable-content-title").should("contain", "Renamed Table");
        cy.get("nav .editable-content-title input").should("not.exist");

        // Verify the sidebar is updated
        cy.get(`[data-document-id="${tableId}"] span.truncate`).should("contain", "Renamed Table");
      });
    });

    it("cancels editing on Escape", function () {
      cy.appEval("Table.find(:projects).id").then((tableId) => {
        cy.visit(`/t/${tableId}`);

        cy.get("nav .editable-content-title.editable").click();
        cy.get("nav .editable-content-title input").clear();
        cy.get("nav .editable-content-title input").type("Should Not Save");
        cy.get("nav .editable-content-title input").type("{esc}");

        cy.get("nav .editable-content-title").should("contain", "Projects");
        cy.get("nav .editable-content-title input").should("not.exist");
      });
    });
  });

  describe("Table edit page", function () {
    it("displays an editable title in the nav bar", function () {
      cy.appEval("Table.find(:projects).id").then((tableId) => {
        cy.visit(`/t/${tableId}/edit`);
        cy.get("nav .editable-content-title.editable").should("contain", "Projects");
      });
    });
  });

  describe("Object icon in the heading", function () {
    it("shows the icon in its own slot and keeps it out of the title text", function () {
      cy.appEval(`Document.find_by(title: "One").update!(title: "⭐ Roadmap")`);
      cy.visit("/d/one");

      cy.get("nav .editable-content-title .object-icon").should("have.text", "⭐");
      cy.get("nav .editable-content-title").should("contain", "Roadmap");
    });

    it("shows no icon slot at all when the document has none", function () {
      cy.visit("/d/one");

      cy.get("nav .editable-content-title").should("contain", "One");
      cy.get("nav .editable-content-title .object-icon").should("not.exist");
    });

    // The title field is still the only way to set an icon, so it has to show
    // one. Binding the input to the stored (stripped) title would hide the icon
    // from the user and then clear it the moment they saved.
    it("puts the emoji back into the edit field so it can be changed", function () {
      cy.appEval(`Document.find_by(title: "One").update!(title: "⭐ Roadmap")`);
      cy.visit("/d/one");

      cy.get("nav .editable-content-title.editable").click();
      cy.get("nav .editable-content-title input").should("have.value", "⭐ Roadmap");
    });

    it("moves a newly typed emoji into the icon slot on save", function () {
      cy.visit("/d/one");

      cy.intercept("PATCH", "/d/one").as("rename");
      cy.get("nav .editable-content-title.editable").click();
      cy.get("nav .editable-content-title input").clear();
      cy.get("nav .editable-content-title input").type("⭐ Roadmap");
      cy.get("nav .editable-content-title input").blur();
      cy.wait("@rename");

      cy.get("nav .editable-content-title .object-icon").should("have.text", "⭐");
      cy.get("nav .editable-content-title").should("not.contain", "⭐ Roadmap");
      cy.get("nav .editable-content-title").should("contain", "Roadmap");
    });
  });
});
