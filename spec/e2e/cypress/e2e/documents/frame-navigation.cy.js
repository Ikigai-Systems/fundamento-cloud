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

    cy.get("#space-sidebar a.content-link").should("exist");
    cy.intercept("GET", /\/s\/.*\/sidebar/).as("sidebarReload");

    cy.openSidebar().find("a.content-link[href='/d/two']").click();

    cy.get("#content").should("exist");
    cy.url().should("include", "/d/two");
    cy.get("@sidebarReload.all").should("have.length", 0);
  });

  it("marks the navigated-to document as selected in the sidebar", function () {
    cy.visit("/d/one");

    cy.openSidebar().find("a.content-link[href='/d/two']").click();
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

  it("shows the not-found page, not an empty frame, when a linked document does not exist", function () {
    cy.visit("/d/one");
    cy.get("#content").should("exist");

    cy.get("#content").then(($content) => {
      const link = $content[0].ownerDocument.createElement("a");
      link.href = "/d/does-not-exist";
      link.id = "missing-document-link";
      link.textContent = "Missing document";
      $content[0].prepend(link);
    });
    cy.get("#missing-document-link").click();

    cy.url().should("include", "/d/does-not-exist");
    cy.contains("Content missing").should("not.exist");
    cy.get("#content").should("not.exist");
    cy.get("body").invoke("text").should("not.be.empty");
  });
});
