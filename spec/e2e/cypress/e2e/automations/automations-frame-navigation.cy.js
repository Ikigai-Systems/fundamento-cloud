import {isOrganizationCookie} from "../../support/organization-cookies.js";

// Regression: the "Automations" item in the document/table menu navigates the
// `content` Turbo Frame. AutomationsController used to render the plain
// `application` layout, which has no <turbo-frame id="content">, so Turbo
// replaced the frame with "Content missing".
describe("Automations navigation from the content frame", function () {
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
        "tables/tables",
        "automations",
      ]
    });

    cy.loginWithSession("pawel@ikigai.systems", "password");
    cy.setCookie("organization_id", isOrganizationCookie);
  });

  function openContentMenu() {
    cy.get("#content_menu_button").click();
  }

  it("opens the automations list from the document menu", function () {
    cy.visit("/d/one");

    cy.get("#space-sidebar").should("exist");
    openContentMenu();
    cy.contains("[role='menuitem']", "Automations").click();

    cy.url().should("include", "/s/is_default/automations");
    cy.contains("Content missing").should("not.exist");

    // The automations page rendered inside the content frame, with the
    // surrounding chrome intact.
    cy.get("#content").should("exist");
    cy.get("#space-sidebar").should("exist");
    cy.contains("h1", "Automations").should("be.visible");
    cy.get("#automations").should("contain", "Test Webhook");
  });

  it("opens the automations list from the table menu", function () {
    cy.visit("/t/orders");

    cy.get("#space-sidebar").should("exist");
    openContentMenu();
    cy.contains("[role='menuitem']", "Automations").click();

    cy.url().should("include", "/s/is_default/automations");
    cy.contains("Content missing").should("not.exist");

    cy.get("#content").should("exist");
    cy.get("#space-sidebar").should("exist");
    cy.contains("h1", "Automations").should("be.visible");
    cy.get("#automations").should("contain", "Test Webhook");
  });

  it("keeps the chrome when drilling into a single automation", function () {
    cy.visit("/d/one");

    openContentMenu();
    cy.contains("[role='menuitem']", "Automations").click();

    cy.get("#automations").contains("a", "Show").click();

    cy.url().should("include", "/s/is_default/automations/iswebhook1");
    cy.contains("Content missing").should("not.exist");
    cy.get("#content").should("exist");
    cy.get("#space-sidebar").should("exist");
    cy.contains("h1", "Test Webhook").should("be.visible");
  });

  it("renders the full layout on direct access to the automations list", function () {
    cy.visit("/s/is_default/automations");

    cy.get("#space-sidebar").should("exist");
    cy.get("#content").should("exist");
    cy.contains("h1", "Automations").should("be.visible");
  });
});
