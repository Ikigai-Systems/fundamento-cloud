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

    it("opens the navigation from the top bar and closes it from the backdrop", () => {
      cy.visit("/d/one")
      cy.get("[data-document-editor] [role='textbox']").should("exist")

      cy.get("button[aria-controls='space-sidebar']").should("have.attr", "aria-expanded", "false").realTouch()
      cy.get("button[aria-controls='space-sidebar']").should("have.attr", "aria-expanded", "true")
      cy.get("#space-sidebar").should(($sidebar) => {
        expect($sidebar[0].getBoundingClientRect().left, "drawer slid in").to.be.at.least(0)
      })
      cy.get("#space-sidebar li[data-node-id='two']").should("be.visible")
      // The desktop edge toggle belongs to the side-by-side layout, not to a drawer
      cy.get("#space-sidebar .sidebar-trigger-area").should("not.be.visible")
      cy.checkPageHealth()

      // Tap the backdrop to the right of the drawer, where the document is dimmed
      cy.get(".drawer-open .sidebar-backdrop").realTouch({ position: "right" })
      cy.get("button[aria-controls='space-sidebar']").should("have.attr", "aria-expanded", "false")
      cy.get("#space-sidebar").should("not.be.visible")
    })

    it("closes the navigation after opening a document from it", () => {
      cy.visit("/d/one")
      cy.get("[data-document-editor] [role='textbox']").should("exist")

      cy.get("button[aria-controls='space-sidebar']").realTouch()
      // A real tap lands at fixed coordinates, so wait for the drawer to finish sliding in
      cy.get("#space-sidebar").should(($sidebar) => {
        expect($sidebar[0].getBoundingClientRect().left, "drawer slid in").to.be.at.least(0)
      })
      cy.get("#space-sidebar li[data-node-id='two'] a.content-link span.truncate").first().realTouch()

      cy.url().should("include", "/d/two")
      cy.get("#space-sidebar").should("not.be.visible")
    })

    it("opens the document details, and one drawer at a time", () => {
      cy.visit("/d/one")
      cy.get("[data-document-editor] [role='textbox']").should("exist")

      cy.get("button[aria-controls='space-sidebar']").realTouch()
      cy.get("#space-sidebar").should("be.visible")

      // The backdrop covers the top bar too, so the details button is reached with Escape first
      cy.realPress("Escape")
      cy.get("#space-sidebar").should("not.be.visible")

      cy.get("button[aria-controls='content-sidebar']").realTouch()
      cy.get("#content-sidebar").should("be.visible")
      cy.get("#space-sidebar").should("not.be.visible")
    })

    // The edge toggles exist only where the sidebars sit beside the content (1024px and wider);
    // narrower screens use the top bar buttons above. Runs on a landscape tablet.
    it("shows no shortcut tooltip after tapping a sidebar toggle", function () {
      if (Cypress.config("viewportWidth") < 1024) this.skip()
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
