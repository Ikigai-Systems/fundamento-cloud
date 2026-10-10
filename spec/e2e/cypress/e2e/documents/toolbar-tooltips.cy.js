import { isOrganizationCookie } from "../../support/organization-cookies.js"
import { isTouch } from "../../support/device.js"

// Toolbar hints name a button and its shortcut. They answer a mouse and keyboard focus;
// a finger never sees one (devices/touch-smoke.cy.js).
describe("Toolbar tooltips", function () {
  beforeEach(function () {
    if (isTouch()) this.skip()

    cy.app("clean")
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: ["organizations", "users", "organization_memberships", "spaces", "documents", "versions"],
    })
    cy.loginWithSession("pawel@ikigai.systems", "password")
    cy.setCookie("organization_id", isOrganizationCookie)
    cy.visit("/d/one/edit")
    cy.get("[data-document-editor] [role='textbox']").should("exist")
  })

  it("shows the save shortcut while the mouse is over the button", () => {
    cy.get("[aria-label='Save document']").realHover()
    cy.get(".popover-tooltip-card").should("contain", "CMD+Enter")

    cy.get("[data-document-editor] [role='textbox']").realHover()
    cy.get(".popover-tooltip-card").should("not.exist")
  })

  it("shows the save shortcut when the button is reached with the keyboard", () => {
    cy.get("[aria-label='Save document']").focus()
    cy.get(".popover-tooltip-card").should("contain", "CMD+Enter")

    cy.get("[aria-label='Save document']").blur()
    cy.get(".popover-tooltip-card").should("not.exist")
  })
})
