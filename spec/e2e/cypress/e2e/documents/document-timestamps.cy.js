import {isOrganizationCookie} from "../../support/organization-cookies.js";

describe("Document Sidebar Timestamps", function () {
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
    const documentId = "one";

    cy.visit(`/d/${documentId}`);
    cy.waitForEditor();

    openDetailsSidebar();

    cy.get("#details_sidebar_tab").within(() => {
      cy.contains("Created at").should("be.visible");
      cy.contains("Updated at").should("be.visible");

      // Timestamps should display relative time (e.g. "about 1 hour ago", "less than a minute ago")
      cy.get("time").should("have.length.at.least", 2);
      cy.get("time").each(($time) => {
        expect($time.attr("datetime")).to.match(/^\d{4}-\d{2}-\d{2}T/);
      });
    });
  });

  it("displays Published at timestamp for published documents", function () {
    // Document "two" has a version in fixtures
    const documentId = "two";

    cy.visit(`/d/${documentId}`);
    cy.waitForEditor();

    openDetailsSidebar();

    cy.get("#details_sidebar_tab").within(() => {
      cy.contains("Published at").should("be.visible");

      // Should have 3 <time> elements: Created at, Updated at, Published at
      cy.get("time").should("have.length", 3);
    });
  });

  it("displays Draft lozenge for unpublished documents", function () {
    // Document "one" has no versions in fixtures
    const documentId = "one";

    cy.visit(`/d/${documentId}`);
    cy.waitForEditor();

    openDetailsSidebar();

    cy.get("#details_sidebar_tab").within(() => {
      cy.contains("Published at").should("be.visible");
      cy.contains("Draft").should("be.visible");
    });
  });

  it("shows hover popup with local and UTC times", function () {
    const documentId = "one";

    cy.visit(`/d/${documentId}`);
    cy.waitForEditor();

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
    const documentId = "one";

    cy.visit(`/d/${documentId}`);
    cy.waitForEditor();

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
    const documentId = "one";

    cy.visit(`/d/${documentId}`);
    cy.waitForEditor();

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
