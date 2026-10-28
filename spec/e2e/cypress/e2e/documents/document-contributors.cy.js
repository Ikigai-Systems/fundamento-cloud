import {isOrganizationCookie} from "../../support/organization-cookies.js";
import {isTouch} from "../../support/device.js";
import {expectColorLabelKeepsLayout} from "../../support/color-label.js";

// The details sidebar shows four contributors at most; the rest sit behind a "+N" button
describe("Document contributors", function () {
  const OVERFLOW = "[data-controller='disclosure-popover']";
  const BUTTON = `${OVERFLOW} button`;

  before(function () {
    // A mouse is under test here; touch-smoke.cy.js covers the tap
    if (isTouch()) this.skip();
  });

  beforeEach(() => {
    cy.app("clean");
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: ["organizations", "users", "organization_memberships", "spaces", "documents", "versions"],
    });
    cy.appScenario("document_with_many_contributors", {document_id: "two"});

    cy.loginWithSession("pawel@ikigai.systems", "password");
    cy.setCookie("organization_id", isOrganizationCookie);

    cy.visit("/d/two");
    cy.waitForEditor();
    cy.openSidebar("details").within(() => {
      cy.get('[aria-label="Details"]').click();
    });
    cy.get(BUTTON).should("have.attr", "aria-label", "2 more people");
  });

  it("shows the rest on hover and hides them when the mouse leaves", () => {
    cy.get(OVERFLOW).trigger("pointerenter", {pointerType: "mouse"});
    cy.get(`${OVERFLOW} .popover-card`).should("be.visible").and("contain", "Stefan Piotrowski");

    cy.get(OVERFLOW).trigger("pointerleave", {pointerType: "mouse"});
    cy.get(`${OVERFLOW} .popover-card`).should("not.exist");
  });

  it("stays open after a click, until Escape", () => {
    cy.get(OVERFLOW).trigger("pointerenter", {pointerType: "mouse"});
    cy.get(BUTTON).click();
    cy.get(OVERFLOW).trigger("pointerleave", {pointerType: "mouse"});
    cy.get(`${OVERFLOW} .popover-card`).should("be.visible");
    cy.get(BUTTON).should("have.attr", "aria-expanded", "true");

    cy.document().trigger("keydown", {key: "Escape"});
    cy.get(`${OVERFLOW} .popover-card`).should("not.exist");
    cy.get(BUTTON).should("have.attr", "aria-expanded", "false").and("have.focus");
  });

  it("opens from the keyboard and closes with a click outside", () => {
    cy.get(BUTTON).focus();
    cy.realPress("Enter");
    cy.get(`${OVERFLOW} .popover-card`).should("be.visible");

    cy.contains("#details_sidebar_tab p", "Contributors").click();
    cy.get(`${OVERFLOW} .popover-card`).should("not.exist");
  });

  it("underlines the document's title in the history heading without resizing it", function () {
    expectColorLabelKeepsLayout({
      record: `Document.find("two")`,
      visit: () => cy.visit("/d/two/versions"),
      title: "h1.text-4xl",
    });
  });
});
