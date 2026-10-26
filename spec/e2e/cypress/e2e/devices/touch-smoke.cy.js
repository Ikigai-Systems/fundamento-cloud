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

    it("keeps the top bar's Spaces menu on one line", () => {
      cy.visit("/")
      cy.get("#spaces-dropdown").should(($button) => {
        const lineHeight = parseFloat(getComputedStyle($button[0]).lineHeight)
        const { paddingTop, paddingBottom } = getComputedStyle($button[0])
        const contentHeight = $button[0].clientHeight - parseFloat(paddingTop) - parseFloat(paddingBottom)
        expect(contentHeight, "label height").to.be.below(lineHeight * 1.5)
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

    // Below 1024px the sidebars are drawers opened from the top bar. Wider screens, like a
    // landscape tablet, keep them beside the content, where the edge toggles below apply.
    describe("drawers", () => {
      before(function () {
        if (Cypress.config("viewportWidth") >= 1024) this.skip()
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

      // Where the sidebars sit on desktop: navigation first, details last, everything else between
      it("puts each drawer button at the edge its sidebar opens from", () => {
        cy.visit("/d/one")
        cy.get("[data-document-editor] [role='textbox']").should("exist")

        cy.get("button[aria-controls='space-sidebar']").closest("nav").within(($nav) => {
          const controls = [...$nav[0].querySelectorAll("button, a, [role=button]")]
            .filter((element) => element.getClientRects().length > 0)
            .map((element) => element.getBoundingClientRect())
          cy.get("button[aria-controls='space-sidebar']").should(($button) => {
            expect($button[0].getBoundingClientRect().left, "navigation button is leftmost").to.equal(Math.min(...controls.map((rect) => rect.left)))
          })
          cy.get("button[aria-controls='content-sidebar']").should(($button) => {
            expect($button[0].getBoundingClientRect().right, "details button is rightmost").to.equal(Math.max(...controls.map((rect) => rect.right)))
          })
        })
      })

      it("closes the navigation after opening a document from it", () => {
        cy.visit("/d/one")
        cy.get("[data-document-editor] [role='textbox']").should("exist")

        cy.openSidebar()
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
    })

    it("shows the navigation's row buttons beside the titles rather than over them", () => {
      cy.visit("/d/one")
      cy.get("[data-document-editor] [role='textbox']").should("exist")
      cy.openSidebar()
      cy.get("#space-sidebar li[data-node-id='two'] .content-link-button").should("be.visible")

      cy.get("#space-sidebar li[data-node-id='two'] > .content-link-container").first().should(($row) => {
        const title = $row[0].querySelector("a.content-link").getBoundingClientRect()
        const buttons = $row[0].querySelector(".content-link-buttons-container").getBoundingClientRect()
        expect(title.right, "title ends before the buttons start").to.be.at.most(buttons.left)
      })
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

  describe("tooltips", () => {
    beforeEach(() => cy.setCookie("organization_id", isOrganizationCookie))

    // The details sidebar's tabs are icons named by a hint. Switching tabs doesn't navigate,
    // so a hint left behind by the tap would stay on screen.
    it("shows no hint after tapping an icon tab", () => {
      cy.visit("/d/one")
      cy.get("[data-document-editor] [role='textbox']").should("exist")

      cy.openSidebar("details")
      cy.get("#content-sidebar #details").realTouch()

      // Prove the tap landed before asserting the hint's absence
      cy.get("#content-sidebar #details").should("have.attr", "aria-selected", "true")
      cy.get(".popover-tooltip-card").should("not.exist")
    })
  })

  describe("timestamps", () => {
    beforeEach(() => cy.setCookie("organization_id", isOrganizationCookie))

    // A finger can't hover, so a tap opens the exact time, and it stays until a tap elsewhere
    it("opens the exact time with a tap, fits it on screen, and closes it with a tap outside", () => {
      cy.visit("/d/one")
      cy.waitForEditor()

      cy.openSidebar("details").find('[aria-label="Details"]').realTouch()
      cy.get("#details_sidebar_tab time").first().realTouch()
      cy.get("[data-timestamp-popup]").should("be.visible")
      // Overflow and the copy buttons' size, with the popup open
      cy.checkPageHealth()

      cy.get("[data-timestamp-popup] button[data-copy-value]").first().realTouch()
      cy.get("[data-timestamp-popup] .icon-\\[tabler--check\\]").should("exist")

      cy.contains("#details_sidebar_tab p", "Created at").realTouch()
      cy.get("[data-timestamp-popup]").should("not.exist")
    })
  })

  describe("contributors", () => {
    beforeEach(() => cy.setCookie("organization_id", isOrganizationCookie))

    // The people behind "+N" were listed only on hover, which a finger can't do
    it("lists the hidden contributors with a tap and closes them with a tap outside", () => {
      cy.appScenario("document_with_many_contributors", { document_id: "one" })
      // An empty document opens in the editor, whose top bar fits a phone; the view page's doesn't yet
      cy.visit("/d/one")
      cy.waitForEditor()

      cy.openSidebar("details").find('[aria-label="Details"]').realTouch()
      cy.get("#details_sidebar_tab button[aria-label='2 more people']").realTouch()
      cy.get("#details_sidebar_tab .popover-card").should("be.visible").and("contain", "Zofia Nowak")
      cy.checkPageHealth()

      cy.contains("#details_sidebar_tab p", "Contributors").realTouch()
      cy.get("#details_sidebar_tab .popover-card").should("not.exist")
    })
  })

  describe("hover styles", () => {
    beforeEach(() => cy.setCookie("organization_id", isOrganizationCookie))

    // A touch browser leaves the last element tapped in the hover state, so a hover: style would
    // stay on a button after the tap. hover: applies only where a pointer can hover.
    it("leaves no hover style on a button after tapping it", () => {
      cy.visit("/d/one")
      cy.waitForEditor()

      cy.get("nav button[aria-label='Search']").realTouch()
      cy.get("ninja-keys").shadow().find(".modal").should("have.class", "visible")
      cy.get("ninja-keys").shadow().find("ninja-header").shadow().find("#search").type("{esc}")
      cy.get("ninja-keys").shadow().find(".modal").should("not.have.class", "visible")

      // The notifications button beside it has the same style and was never touched
      cy.get("[data-testid='notifications-button']").then(($untouched) => {
        const { backgroundColor } = getComputedStyle($untouched[0])
        cy.get("nav button[aria-label='Search']").should("have.css", "background-color", backgroundColor)
      })
    })
  })

  describe("switching organization", () => {
    it("switches by tapping, and the confirmation fits on screen", () => {
      cy.visit("/organizations")
      cy.contains("tr", "Ikigai Systems").within(() => cy.contains("Switch to").realTouch())

      cy.url().should("include", "/s/is_default")
      // Retried, because the banner animates in and is only judged once it settles
      cy.contains("[data-controller=alert]", "switched to").should(($flash) => {
        const rect = $flash[0].querySelector("[class*=flash-]").getBoundingClientRect()
        const viewportWidth = $flash[0].ownerDocument.documentElement.clientWidth
        expect(rect.right, "flash right edge").to.be.at.most(viewportWidth)
        expect(rect.left, "flash left edge").to.be.at.least(0)
        // Below the 60px top bar, so it doesn't hide the menu or the page title
        expect(rect.top, "flash top edge").to.be.at.least(60)
      })
      cy.contains("[data-controller=alert]", "switched to").find("button[aria-label=Close]").should(($close) => {
        const { width, height } = $close[0].getBoundingClientRect()
        expect(Math.min(width, height), "close button tap target").to.be.at.least(24)
      })

      // A confirmation closes itself rather than sitting over the content until dismissed
      cy.contains("[data-controller=alert]", "switched to", { timeout: 10000 }).should("not.exist")
    })

    // iOS Safari restores a tab from its page cache after the session has rotated, so the
    // form posts a token the server no longer accepts. Production saw 13 silent 422s from one
    // phone in a minute. Whatever the outcome, the user must be told something happened.
    it("tells the user when the form's security token has expired", () => {
      cy.visit("/organizations")
      // A page restored from cache holds a stale token in both places Turbo sends one from:
      // the form's hidden field and the `csrf-token` meta tag it copies into X-CSRF-Token.
      // Rails accepts either, so spoiling only the field leaves the request valid.
      cy.contains("tr", "Ikigai Systems").find("input[name=authenticity_token]").invoke("val", "stale-token")
      cy.get("meta[name=csrf-token]").invoke("attr", "content", "stale-token")
      cy.contains("tr", "Ikigai Systems").within(() => cy.contains("Switch to").realTouch())

      cy.contains("[data-controller=alert]", /expired.*try again/i).should("be.visible")
      cy.url().should("include", "/organizations")

      // The page came back with a fresh token, so the retry the message asks for works
      cy.contains("tr", "Ikigai Systems").within(() => cy.contains("Switch to").realTouch())
      cy.url().should("include", "/s/is_default")
    })
  })
})
