import {isOrganizationCookie} from "../../support/organization-cookies.js";

// Regression: pages using the full_width_application layout (empty space landing,
// document version history) must keep the sidebar stable across navigation.
// Without the content turbo frame on those pages, sidebar links fail with "Content missing".
describe("Content frame navigation on full-width pages", function () {
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

  describe("Empty space landing page (spaces#show without home document)", function () {
    beforeEach(() => {
      // is_default has no home_document, so visiting /s/is_default lands on the empty page
      cy.appEval(`Space.find("is_default").update_column(:home_document_id, nil)`);
    });

    it("navigates to a sidebar document without reloading the sidebar", function () {
      cy.visit("/s/is_default");

      cy.get("#space-sidebar").should("exist");
      cy.intercept("GET", /\/s\/.*\/sidebar/).as("sidebarReload");

      cy.get("#space-sidebar a.content-link[href='/d/one']").click();

      cy.get("#content").should("exist");
      cy.url().should("include", "/d/one");
      cy.get("@sidebarReload.all").should("have.length", 0);
    });

    it("renders both sidebars and the content frame on direct access", function () {
      cy.visit("/s/is_default");

      cy.get("#space-sidebar").should("exist");
      cy.get("#content").should("exist");
    });
  });

  describe("Document version history page (versions#index)", function () {
    it("navigates to a sidebar document without reloading the sidebar", function () {
      cy.visit("/d/one/versions");

      cy.get("#space-sidebar").should("exist");
      cy.intercept("GET", /\/s\/.*\/sidebar/).as("sidebarReload");

      cy.get("#space-sidebar a.content-link[href='/d/two']").click();

      cy.get("#content").should("exist");
      cy.url().should("include", "/d/two");
      cy.get("@sidebarReload.all").should("have.length", 0);
    });

    it("renders sidebar and content frame on direct access", function () {
      cy.visit("/d/one/versions");

      cy.get("#space-sidebar").should("exist");
      cy.get("#content").should("exist");
    });
  });
});
