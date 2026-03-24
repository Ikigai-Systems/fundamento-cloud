import {isOrganizationCookie} from "../../support/organization-cookies.js";

describe("Document Editor - Connection Indicator", function () {
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
      ],
    });

    cy.loginWithSession("pawel@ikigai.systems", "password");
    cy.setCookie("organization_id", isOrganizationCookie);

    cy.appEval("Document.first.id").then((documentId) => {
      cy.visit(`/d/${documentId}/edit`);
    });

    cy.waitForEditor();
  });

  it("shows Offline label when connection becomes stale", function () {
    cy.get("[data-connection-indicator-target='offlineLabel']")
      .should("not.be.visible");

    cy.window().then((win) => {
      win.dispatchEvent(
        new win.CustomEvent("editor:connection-changed", {
          detail: {stale: true},
          bubbles: true,
        })
      );
    });

    cy.get("[data-connection-indicator-target='offlineLabel']")
      .should("be.visible")
      .and("contain", "Offline");
  });

  it("shows disconnection flash message when connection becomes stale", function () {
    cy.window().then((win) => {
      win.dispatchEvent(
        new win.CustomEvent("editor:connection-changed", {
          detail: {stale: true},
          bubbles: true,
        })
      );
    });

    cy.get("#flashes").should(
      "contain",
      "Disconnected from the server. Your changes are stored only locally."
    );
  });

  it("hides Offline label and shows recovery flash when connection is restored", function () {
    cy.window().then((win) => {
      win.dispatchEvent(
        new win.CustomEvent("editor:connection-changed", {
          detail: {stale: true},
          bubbles: true,
        })
      );
    });

    cy.get("[data-connection-indicator-target='offlineLabel']")
      .should("be.visible");

    cy.window().then((win) => {
      win.dispatchEvent(
        new win.CustomEvent("editor:connection-changed", {
          detail: {stale: false},
          bubbles: true,
        })
      );
    });

    cy.get("[data-connection-indicator-target='offlineLabel']")
      .should("not.be.visible");

    cy.get("#flashes").should("contain", "Connection to server restored.");
  });
});
