import {isOrganizationCookie} from "../../support/organization-cookies.js";

describe("Space sidebar tree", function () {
  beforeEach(() => {
    cy.app("clean");
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: ["organizations", "users", "organization_memberships", "spaces", "documents"],
    });
    // Nest "two" under "one" so we can test expansion.
    cy.appEval(`
      space = Space.find("is_default")
      space.update!(hierarchy: [{ "id" => "one", "children" => [{ "id" => "two", "children" => [] }] }])
    `);
    cy.loginWithSession("pawel@ikigai.systems", "password");
    cy.setCookie("organization_id", isOrganizationCookie);
  });

  it("renders only root nodes until a node is expanded", function () {
    cy.visit("/d/one");

    cy.get("#space-sidebar li[data-node-id='one']").should("exist");
    cy.get("#space-sidebar li[data-node-id='two']").should("not.exist");

    cy.get("#space-sidebar li[data-node-id='one'] .collapsible-trigger").click();

    cy.get("#space-sidebar li[data-node-id='two']").should("exist");
  });

  it("removes children from the DOM again when collapsed", function () {
    cy.visit("/d/one");

    cy.get("#space-sidebar li[data-node-id='one'] .collapsible-trigger").click();
    cy.get("#space-sidebar li[data-node-id='two']").should("exist");

    cy.get("#space-sidebar li[data-node-id='one'] .collapsible-trigger").first().click();
    cy.get("#space-sidebar li[data-node-id='two']").should("not.exist");
  });

  it("does not render the whole tree into the DOM", function () {
    cy.visit("/d/one");

    cy.get("#space-sidebar li[data-node-id='one']").should("exist");
    cy.get("#space-sidebar li.section-content-node-container").should("have.length", 1);
  });
});
