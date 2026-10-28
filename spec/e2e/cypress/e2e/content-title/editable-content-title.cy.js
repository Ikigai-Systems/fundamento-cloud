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

  describe("color label", function () {
    const LONG_TITLE = "A very long document title that cannot possibly fit into the narrow top bar without being cut short";

    function expectUnderline($el) {
      const style = getComputedStyle($el[0]);
      expect(style.backgroundImage, "background-image").to.not.equal("none");
      expect(style.backgroundSize, "background-size").to.contain("3px");
    }

    it("a colored document shows the underline in the tree and on the page title", function () {
      cy.appEval(`Document.find("one").update!(color: "indigo")`);
      cy.visit("/d/one");

      cy.get("nav .editable-content-title [data-color='indigo']")
        .should("have.text", "One")
        .and("have.class", "color-label")
        .should(expectUnderline);
      cy.get("#space-sidebar li[data-node-id='one'] span.truncate").should("have.attr", "data-color", "indigo");
      cy.get("#space-sidebar li[data-node-id='one'] span.truncate").should(expectUnderline);
    });

    it("a document without a color has no label element on the page title", function () {
      cy.visit("/d/one");

      cy.get("nav .editable-content-title").should("contain", "One");
      cy.get("nav .editable-content-title .color-label").should("not.exist");
    });

    it("the page title input carries no underline while editing", function () {
      cy.appEval(`Document.find("one").update!(color: "indigo")`);
      cy.visit("/d/one");

      cy.get("nav .editable-content-title.editable").click();
      cy.get("nav .editable-content-title input").should("exist");
      cy.get("nav .editable-content-title .color-label").should("not.exist");
      cy.get("nav .editable-content-title input").then(($input) => {
        expect(getComputedStyle($input[0]).backgroundImage).to.equal("none");
      });
    });

    it("a colored table shows the underline in the tree and on the page title", function () {
      cy.appEval(`Table.first.tap { |t| t.update!(color: "teal") }.id`).then((tableId) => {
        cy.visit(`/t/${tableId}`);

        cy.get("nav .editable-content-title [data-color='teal']").should(expectUnderline);
        cy.get(`#space-sidebar [data-document-id='${tableId}'] span.truncate`).should("have.attr", "data-color", "teal");
        cy.get(`#space-sidebar [data-document-id='${tableId}'] span.truncate`).should(expectUnderline);

        // The server-rendered Tables row follows a color event without a reload
        cy.window().then((win) => {
          win.dispatchEvent(new win.CustomEvent("content-updated", {detail: {id: tableId, color: "crimson"}}));
        });
        cy.get(`#space-sidebar [data-document-id='${tableId}'] span.truncate`)
          .should("have.attr", "data-color", "crimson");
        cy.get("nav .editable-content-title [data-color='crimson']").should("exist");
      });
    });

    it("renaming a colored table keeps the color on its sidebar row", function () {
      cy.appEval(`Table.first.tap { |t| t.update!(color: "teal") }.id`).then((tableId) => {
        cy.visit(`/t/${tableId}`);
        const row = `#space-sidebar [data-document-id='${tableId}'] span.truncate`;
        cy.get(row).should("have.attr", "data-color", "teal");

        cy.window().then((win) => {
          win.dispatchEvent(new win.CustomEvent("content-updated", {detail: {id: tableId, title: "Renamed table", icon: null}}));
        });
        cy.get(row).should("have.text", "Renamed table");
        cy.get(row).should("have.attr", "data-color", "teal");
      });
    });

    it("a title that truncates keeps the underline within the visible text", function () {
      cy.appEval(`Document.find("one").update!(color: "teal", title: ${JSON.stringify(LONG_TITLE)})`);
      cy.viewport(480, 800);
      cy.visit("/d/one");

      cy.get("nav .editable-content-title").then(($title) => {
        const heading = $title[0];
        // Truncated, with an ellipsis: the text is wider than the box that shows it
        expect(heading.scrollWidth, "text overflows").to.be.greaterThan(heading.clientWidth);
      });
      cy.get("nav .editable-content-title [data-color='teal']").should(expectUnderline).then(($label) => {
        const heading = $label[0].closest(".editable-content-title");
        const label = $label[0].getBoundingClientRect();
        const box = heading.getBoundingClientRect();
        // The strip is painted at the label's bottom edge: that edge must lie inside the
        // clipping heading, or overflow hidden cuts it off
        expect(label.bottom, "strip bottom inside the clipping box").to.be.at.most(box.bottom);
        expect(label.top, "strip top inside the clipping box").to.be.at.least(box.top);
      });
    });

    it("renaming a colored document keeps its color, and a color event leaves the title alone", function () {
      cy.appEval(`Document.find("one").update!(color: "indigo")`);
      cy.visit("/d/one");
      cy.get("nav .editable-content-title [data-color='indigo']").should("exist");
      // The sidebar loads lazily and only hears events once its tree is rendered
      cy.get("#space-sidebar li[data-node-id='one'] span.truncate").should("have.attr", "data-color", "indigo");

      cy.intercept("PATCH", "/d/one").as("rename");
      cy.get("nav .editable-content-title.editable").click();
      cy.get("nav .editable-content-title input").clear();
      cy.get("nav .editable-content-title input").type("Renamed colored");
      cy.get("nav .editable-content-title input").blur();
      cy.wait("@rename");

      // The rename publishes {id, title, icon}: the color must survive it, in both places
      cy.get("nav .editable-content-title [data-color='indigo']").should("have.text", "Renamed colored");
      cy.get("#space-sidebar li[data-node-id='one'] span.truncate").should("have.text", "Renamed colored");
      cy.get("#space-sidebar li[data-node-id='one'] span.truncate").should("have.attr", "data-color", "indigo");

      // A color-only event changes the color and nothing else
      cy.window().then((win) => {
        win.dispatchEvent(new win.CustomEvent("content-updated", {detail: {id: "one", color: "crimson"}}));
      });
      cy.get("nav .editable-content-title [data-color='crimson']").should("have.text", "Renamed colored");
      cy.get("#space-sidebar li[data-node-id='one'] span.truncate").should("have.attr", "data-color", "crimson");
      cy.get("#space-sidebar li[data-node-id='one'] span.truncate").should("have.text", "Renamed colored");

      // An event for another document is ignored
      cy.window().then((win) => {
        win.dispatchEvent(new win.CustomEvent("content-updated", {detail: {id: "two", color: "lime"}}));
      });
      cy.get("nav .editable-content-title [data-color='crimson']").should("exist");

      // null clears
      cy.window().then((win) => {
        win.dispatchEvent(new win.CustomEvent("content-updated", {detail: {id: "one", color: null}}));
      });
      cy.get("nav .editable-content-title .color-label").should("not.exist");
      cy.get("nav .editable-content-title").should("contain", "Renamed colored");
    });
  });
});
