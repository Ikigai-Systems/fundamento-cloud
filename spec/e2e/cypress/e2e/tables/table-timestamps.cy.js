import {isOrganizationCookie} from "../../support/organization-cookies.js";

describe("Table Sidebar Timestamps", function () {
  beforeEach(() => {
    cy.app("clean");

    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: [
        "organizations",
        "users",
        "organization_memberships",
        "spaces",
        "tables/tables",
      ]
    });

    cy.loginWithSession("pawel@ikigai.systems", "password");

    cy.setCookie("organization_id", isOrganizationCookie);
  });

  function openDetailsSidebar() {
    cy.get("#content-sidebar").within(() => {
      cy.get('[aria-label="Details"]').click();
    });
  }

  it("displays Created at and Updated at timestamps", function () {
    const tableId = "orders";

    cy.visit(`/t/${tableId}`);
    cy.contains("Loading content").should("not.be.visible");

    openDetailsSidebar();

    cy.get("#details_sidebar_tab").within(() => {
      cy.contains("Created at").should("be.visible");
      cy.contains("Updated at").should("be.visible");

      // Timestamps should display relative time with valid ISO datetime attributes
      cy.get("time").should("have.length", 2);
      cy.get("time").each(($time) => {
        expect($time.attr("datetime")).to.match(/^\d{4}-\d{2}-\d{2}T/);
      });
    });
  });

  it("shows hover popup with local and UTC times", function () {
    const tableId = "orders";

    cy.visit(`/t/${tableId}`);
    cy.contains("Loading content").should("not.be.visible");

    openDetailsSidebar();

    // Hover over the first timestamp
    cy.get("#details_sidebar_tab time").first().trigger("mouseenter");

    // Popup should appear with local and UTC time sections
    cy.get("[data-timestamp-popup]", { timeout: 5000 }).should("be.visible");
    cy.get("[data-timestamp-popup]").within(() => {
      cy.contains("Your device").should("be.visible");
      cy.contains("UTC").should("be.visible");
    });
  });

  it("dismisses hover popup on mouse leave", function () {
    const tableId = "orders";

    cy.visit(`/t/${tableId}`);
    cy.contains("Loading content").should("not.be.visible");

    openDetailsSidebar();

    // Hover to show popup
    cy.get("#details_sidebar_tab time").first().trigger("mouseenter");
    cy.get("[data-timestamp-popup]", { timeout: 5000 }).should("be.visible");

    // Leave to dismiss
    cy.get("#details_sidebar_tab time").first().trigger("mouseleave");

    // Popup should disappear (150ms delay + buffer)
    cy.get("[data-timestamp-popup]", { timeout: 5000 }).should("not.exist");
  });

  it("shows copy feedback when clicking clipboard button", function () {
    const tableId = "orders";

    cy.visit(`/t/${tableId}`);
    cy.contains("Loading content").should("not.be.visible");

    openDetailsSidebar();

    // Hover to show popup
    cy.get("#details_sidebar_tab time").first().trigger("mouseenter");
    cy.get("[data-timestamp-popup]", { timeout: 5000 }).should("be.visible");

    // Click the first copy button
    cy.get("[data-timestamp-popup] button[data-copy-value]").first().click();

    // Icon should change to checkmark
    cy.get("[data-timestamp-popup] button[data-copy-value]").first().within(() => {
      cy.get(".icon-\\[heroicons--check\\]").should("exist");
    });
  });
});
