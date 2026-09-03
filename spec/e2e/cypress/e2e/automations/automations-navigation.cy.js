import {isOrganizationCookie} from "../../support/organization-cookies.js";

// Regression: the "Automations" item in the document/table menu sits inside the
// `content` Turbo Frame. Without `turbo_frame: "_top"` Turbo tried to swap the
// frame, the standalone automations page carried no <turbo-frame id="content">,
// and the frame was replaced with "Content missing".
//
// Automations is a space-level page in its own right, so the link must leave the
// frame behind and perform a full page visit.
describe("Automations navigation from the content menu", function () {
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

  function assertStandaloneAutomationsPage() {
    cy.url().should("include", "/s/is_default/automations");
    cy.contains("Content missing").should("not.exist");

    // A full page visit: the document/table chrome is gone entirely and the
    // automations page stands on its own.
    cy.get("#content").should("not.exist");
    cy.get("#space-sidebar").should("not.exist");
    cy.get("nav.top-nav-bar").should("exist");

    cy.contains("h1", "Automations").should("be.visible");
    cy.get("#automations").should("contain", "Test Webhook");
  }

  it("opens the automations page from the document menu", function () {
    cy.visit("/d/one");

    cy.get("#space-sidebar").should("exist");
    openContentMenu();
    cy.contains("[role='menuitem']", "Automations").click();

    assertStandaloneAutomationsPage();
  });

  it("opens the automations page from the table menu", function () {
    cy.visit("/t/orders");

    cy.get("#space-sidebar").should("exist");
    openContentMenu();
    cy.contains("[role='menuitem']", "Automations").click();

    assertStandaloneAutomationsPage();
  });

  it("drills into a single automation from the list", function () {
    cy.visit("/d/one");

    openContentMenu();
    cy.contains("[role='menuitem']", "Automations").click();

    cy.get("#automations").contains("a", "Show").click();

    cy.url().should("include", "/s/is_default/automations/iswebhook1");
    cy.contains("Content missing").should("not.exist");
    cy.contains("h1", "Test Webhook").should("be.visible");
  });

  it("renders the automations page on direct access", function () {
    cy.visit("/s/is_default/automations");

    cy.get("nav.top-nav-bar").should("exist");
    cy.contains("h1", "Automations").should("be.visible");
    cy.get("#automations").should("contain", "Test Webhook");
  });
});
