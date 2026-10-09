import { isOrganizationCookie } from "../../support/organization-cookies.js"

// Desktop: the sidebars sit beside the content, collapse from their edge, and remember it.
// Narrow screens turn them into drawers instead — see devices/touch-smoke.cy.js.
describe("Sidebar collapse on wide screens", function () {
  beforeEach(function () {
    if (Cypress.config("viewportWidth") < 1024) this.skip()

    cy.app("clean")
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: ["organizations", "users", "organization_memberships", "spaces", "documents", "versions"],
    })
    cy.loginWithSession("pawel@ikigai.systems", "password")
    cy.setCookie("organization_id", isOrganizationCookie)
  })

  it("starts with both sidebars open beside the document", () => {
    cy.visit("/d/one")

    cy.get("#space-sidebar").should("be.visible")
    cy.get("#content-sidebar").should("be.visible")
    cy.get("button[aria-controls='space-sidebar']").should("not.be.visible")
    cy.get(".sidebar-backdrop").should("not.be.visible")
  })

  // The chevron on the panel edge, which is what stays on screen once the sidebar is collapsed
  it("collapses a sidebar from its edge and remembers it on the next page", () => {
    cy.visit("/d/one")

    cy.get("#space-sidebar .sidebar-trigger-button").click()
    cy.get(".sidebar-container:has(#space-sidebar)").should("have.class", "collapsed")
    cy.getCookie("ikigai_userPreferences_leftSideBarExpanded").should("have.property", "value", "false")

    cy.visit("/d/two")
    cy.get(".sidebar-container:has(#space-sidebar)").should("have.class", "collapsed")

    cy.get("#space-sidebar .sidebar-trigger-button").click()
    cy.get(".sidebar-container:has(#space-sidebar)").should("not.have.class", "collapsed")
    cy.getCookie("ikigai_userPreferences_leftSideBarExpanded").should("have.property", "value", "true")
  })

  it("toggles with the [ and ] shortcuts", () => {
    cy.visit("/d/one")
    cy.get("[data-document-editor] [role='textbox']").should("exist")

    cy.get("body").type("]")
    cy.get(".sidebar-container:has(#content-sidebar)").should("have.class", "collapsed")
    cy.get("body").type("]")
    cy.get(".sidebar-container:has(#content-sidebar)").should("not.have.class", "collapsed")
  })
})
