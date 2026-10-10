import { isOrganizationCookie } from "../../support/organization-cookies.js"
import { isTouch } from "../../support/device.js"

// What a phone or tablet user meets first. Runs only as a touch device:
//   npx cypress run --project spec/e2e --expose device=phone --spec "**/devices/*"
describe("Touch device smoke", function () {
  before(function () {
    if (!isTouch()) this.skip()
  })

  beforeEach(() => {
    cy.app("clean")
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: ["organizations", "users", "organization_memberships", "spaces", "documents", "versions"],
    })
    cy.appEval(`
      space = Space.find("is_default")
      space.update!(hierarchy: [{ "id" => "one", "children" => [] }, { "id" => "two", "children" => [] }])
    `)
    cy.loginWithSession("pawel@ikigai.systems", "password")
  })

  describe("page health", () => {
    beforeEach(() => cy.setCookie("organization_id", isOrganizationCookie))

    ;["/", "/d/one", "/organizations", "/users/edit"].forEach((path) => {
      it(`${path} has no overflow, hidden controls, small targets or failed requests`, () => {
        cy.visit(path)
        cy.get("body").should("be.visible")
        cy.checkPageHealth()
      })
    })
  })

  describe("document page", () => {
    beforeEach(() => cy.setCookie("organization_id", isOrganizationCookie))

    it("opens with the document readable rather than covered by the sidebars", () => {
      cy.visit("/d/one")
      cy.get("[data-document-editor] [role='textbox']").should("exist")

      cy.window().then((win) => {
        const { clientWidth, clientHeight } = win.document.documentElement
        const atCentre = win.document.elementFromPoint(clientWidth / 2, clientHeight / 2)
        expect(atCentre.closest("#space-sidebar, #content-sidebar"), "element at the centre of the screen belongs to a sidebar").to.be.null
      })
    })

    it("shows no shortcut tooltip after tapping a sidebar toggle", () => {
      cy.visit("/d/one")
      cy.get("[data-document-editor] [role='textbox']").should("exist")
      // The right sidebar's toggle, because while both are open the right panel covers the left one's
      cy.get(".sidebar-container:has(#content-sidebar)").invoke("hasClass", "collapsed").then((wasCollapsed) => {
        cy.get("#content-sidebar .sidebar-trigger-area").realTouch()

        // Prove the tap landed before asserting the tooltip's absence, or the test passes on a miss
        cy.get(".sidebar-container:has(#content-sidebar)").should(wasCollapsed ? "not.have.class" : "have.class", "collapsed")
        cy.get(".popover-tooltip-card").should("not.exist")
      })
    })
  })

  describe("tooltips", () => {
    beforeEach(() => cy.setCookie("organization_id", isOrganizationCookie))

    // The details sidebar's tabs are icons named by a hint. Switching tabs doesn't navigate,
    // so a hint left behind by the tap would stay on screen.
    it("shows no hint after tapping an icon tab", () => {
      cy.visit("/d/one")
      cy.get("[data-document-editor] [role='textbox']").should("exist")

      // Narrow screens keep the sidebar in a drawer, opened from the top bar
      cy.get("body").then(($body) => {
        const opener = $body.find("button[aria-controls='content-sidebar']:visible")
        if (opener.length) cy.wrap(opener).realTouch()
      })
      // A real tap lands at fixed coordinates, so wait until the sidebar has stopped sliding
      cy.get("#content-sidebar").should(($sidebar) => {
        const { right } = $sidebar[0].getBoundingClientRect()
        expect(right, "sidebar settled on screen").to.be.at.most($sidebar[0].ownerDocument.documentElement.clientWidth)
      })
      cy.get("#content-sidebar #details").realTouch()

      // Prove the tap landed before asserting the hint's absence
      cy.get("#content-sidebar #details").should("have.attr", "aria-selected", "true")
      cy.get(".popover-tooltip-card").should("not.exist")
    })
  })

  describe("switching organization", () => {
    it("switches by tapping, and the confirmation fits on screen", () => {
      cy.visit("/organizations")
      cy.contains("tr", "Ikigai Systems").within(() => cy.contains("Switch to").realTouch())

      cy.url().should("include", "/s/is_default")
      // Retried, because the banner enters from off-screen and is only judged once it settles
      cy.contains("[data-controller=alert]", "switched to").should(($flash) => {
        const rect = $flash[0].querySelector("[class*=flash-]").getBoundingClientRect()
        const viewportWidth = $flash[0].ownerDocument.documentElement.clientWidth
        expect(rect.right, "flash right edge").to.be.at.most(viewportWidth)
        expect(rect.left, "flash left edge").to.be.at.least(0)
      })
    })

    // iOS Safari restores a tab from its page cache after the session has rotated, so the
    // form posts a token the server no longer accepts. Production saw 13 silent 422s from one
    // phone in a minute. Whatever the outcome, the user must be told something happened.
    it("tells the user when the form's security token has expired", () => {
      cy.visit("/organizations")
      cy.contains("tr", "Ikigai Systems").find("input[name=authenticity_token]").invoke("val", "stale-token")
      cy.contains("tr", "Ikigai Systems").within(() => cy.contains("Switch to").realTouch())

      cy.contains("[role=alert], [data-controller=alert]", /try again|expired|session/i).should("be.visible")
    })
  })
})
