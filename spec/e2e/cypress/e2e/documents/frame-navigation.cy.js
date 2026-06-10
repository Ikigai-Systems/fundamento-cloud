import {isOrganizationCookie} from "../../support/organization-cookies.js";

describe("Content frame navigation — sidebar stability", function () {
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
      ]
    });

    cy.loginWithSession("pawel@ikigai.systems", "password");
    cy.setCookie("organization_id", isOrganizationCookie);
  });

  it("does not reload the space sidebar when clicking a document link", function () {
    cy.visit("/d/one");

    // Intercept sidebar requests after the initial page load completes
    cy.get("#space-sidebar").should("exist");
    cy.intercept("GET", /\/s\/.*\/sidebar/).as("sidebarReload");

    // Click the second document in the sidebar
    cy.get("[data-document-id='two'] a.content-link").click();

    // Content frame should update
    cy.get("#content").should("exist");

    // URL should update to the second document
    cy.url().should("include", "/d/two");

    // The sidebar must NOT have been reloaded
    cy.get("@sidebarReload").should("not.have.been.called");
  });

  it("marks the navigated-to document as selected in the sidebar", function () {
    cy.visit("/d/one");

    cy.get("[data-document-id='two'] a.content-link").click();
    cy.url().should("include", "/d/two");

    cy.get("[data-document-id='two']")
      .closest(".content-link-container")
      .should("have.class", "selected");

    cy.get("[data-document-id='one']")
      .closest(".content-link-container")
      .should("not.have.class", "selected");
  });

  it("renders the full layout including left sidebar on direct URL access", function () {
    cy.visit("/d/one");

    cy.get("#space-sidebar").should("exist");
    cy.get("#content-sidebar").should("exist");
    cy.get("#content").should("exist");
  });
});
