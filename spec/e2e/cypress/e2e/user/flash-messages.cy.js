import { isOrganizationCookie } from "../../support/organization-cookies.js"

// Notices confirm something and close themselves; alerts and errors stay until closed.
describe("Flash messages", function () {
  beforeEach(function () {
    cy.app("clean")
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: ["organizations", "users", "organization_memberships", "spaces", "documents", "versions"],
    })
    cy.loginWithSession("pawel@ikigai.systems", "password")
    cy.setCookie("organization_id", isOrganizationCookie)
    cy.visit("/d/one")
  })

  const flash = (options) => cy.window().then((win) => {
    const flashes = win.document.querySelector("#flashes")
    win.Stimulus.getControllerForElementAndIdentifier(flashes, "flash-manager").show(options)
  })

  it("closes a notice by itself after a few seconds", () => {
    flash({ type: "notice", message: "Notice that closes" })
    cy.contains("#flashes [data-controller=alert]", "Notice that closes").should("be.visible")
    cy.contains("#flashes [data-controller=alert]", "Notice that closes", { timeout: 5000 }).should("not.exist")
  })

  it("keeps a notice open while it is hovered, then closes it after leaving", () => {
    flash({ type: "notice", message: "Notice being read" })
    cy.contains("#flashes [data-controller=alert]", "Notice being read").realHover()

    cy.wait(4000)
    cy.contains("#flashes [data-controller=alert]", "Notice being read").should("be.visible")

    cy.get("[data-document-editor]").realHover()
    cy.contains("#flashes [data-controller=alert]", "Notice being read", { timeout: 5000 }).should("not.exist")
  })

  it("keeps an error until it is closed", () => {
    flash({ type: "error", message: "Error that stays" })

    cy.wait(4000)
    cy.contains("#flashes [data-controller=alert]", "Error that stays").should("be.visible")
      .find("[aria-label=Close]").click()
    cy.contains("#flashes [data-controller=alert]", "Error that stays").should("not.exist")
  })
})
