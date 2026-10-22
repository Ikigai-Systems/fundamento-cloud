import { isOrganizationCookie } from "../../support/organization-cookies.js"
import { isTouch } from "../../support/device.js"

// What people do on a phone, start to finish, tapping with `.realTouch()`: no hover, mouse
// or keyboard shortcut, only what a finger reaches. Text is still entered with
// `cy.type()`, since the on-screen keyboard is outside what Cypress can drive. Runs only as a
// touch device:
//
//   npx cypress run --project spec/e2e --expose device=phone --spec "**/devices/journeys.cy.js"
//
// A journey the app doesn't support on touch yet is pending, named after what is missing.

// `.realTouch()` misplaces a target inside a shadow root (in the emoji picker, by the height of its
// sticky header), so tap the screen where the element is
const tapOnScreen = ($element) => {
  const { x, y, width, height } = $element[0].getBoundingClientRect()
  cy.get("body").realTouch({ x: x + width / 2, y: y + height / 2, scrollBehavior: false })
}

const FIXTURES = [
  "organizations", "users", "organization_memberships", "spaces", "documents", "versions",
  "tables/tables", "tables/columns", "tables/rows", "tables/cells",
]

describe("Touch journeys", function () {
  before(function () {
    if (!isTouch()) this.skip()
  })

  beforeEach(() => {
    cy.app("clean")
    cy.appFixtures({ fixtures_dir: "spec/fixtures", fixtures: FIXTURES })
    cy.appEval(`
      Space.find("is_default").update!(hierarchy: [{ "id" => "one", "children" => [] }, { "id" => "two", "children" => [] }])
    `)
  })

  describe("signing in and out", () => {
    it("signs in through the form and picks an organization", () => {
      cy.visit("/users/sign_in")
      cy.get("input[name='user[email]']").realTouch()
      cy.focused().type("pawel@ikigai.systems")
      cy.contains("input[type=submit]", "Continue").realTouch()

      // The second step offers a password or an emailed link
      cy.get("input[name='user[password]']").realTouch()
      cy.focused().type("password")
      cy.get("input[type=submit][value='Sign in with password']").realTouch()

      // Two organizations, so the user is asked which one
      cy.url().should("include", "/organizations")
      cy.contains("tr", "Ikigai Systems").within(() => cy.contains("Switch to").realTouch())
      cy.url().should("include", "/s/is_default")
    })

    it("signs out from the user menu", () => {
      cy.loginWithSession("pawel@ikigai.systems", "password")
      cy.setCookie("organization_id", isOrganizationCookie)
      cy.visit("/d/one")
      cy.waitForEditor()

      cy.get("#user-dropdown").realTouch()
      cy.contains("[role=menu] button", "Sign out").should("be.visible").realTouch()
      cy.url().should("include", "/users/sign_in")
    })
  })

  describe("signed in", () => {
    beforeEach(() => {
      cy.loginWithSession("pawel@ikigai.systems", "password")
      cy.setCookie("organization_id", isOrganizationCookie)
    })

    it("switches organization from the user menu", () => {
      cy.visit("/d/one")
      cy.waitForEditor()

      cy.get("#user-dropdown").realTouch()
      cy.contains("[role=menu] a", "Organizations").should("be.visible").realTouch()
      cy.contains("tr", "HeroCoders").within(() => cy.contains("Switch to").realTouch())

      // Lands on one of HeroCoders' spaces
      cy.url().should("match", /\/s\/hc_/)
      cy.contains("[data-controller=alert]", "switched to").should("be.visible")
    })

    it("switches space from the navigation", () => {
      cy.appEval(`Space.create!(organization_id: "is", name: "Second IS Space", access_mode: :public)`)
      cy.visit("/d/one")
      cy.waitForEditor()

      cy.openSidebar().find("#spaces-dropdown").realTouch()
      cy.contains("#space-sidebar [role=menuitem]", "Second IS Space").should("be.visible").realTouch()

      // A new space opens on its first document
      cy.url().should("not.include", "/d/one")
      cy.openSidebar().find("#spaces-dropdown").should("contain", "Second IS Space")
    })

    it("searches from the top bar", () => {
      cy.visit("/d/one")
      cy.waitForEditor()

      cy.get("nav button[aria-label='Search']").should("be.visible").realTouch()
      cy.get("ninja-keys").shadow().find(".modal").should("have.class", "visible")
      cy.get("ninja-keys").shadow().find("ninja-header").shadow().find("#search").type("Two")

      cy.get("ninja-keys").shadow()
        .find("ninja-action")
        .should(($actions) => {
          const titles = [...$actions].map((action) => action.shadowRoot?.querySelector(".ninja-title")?.textContent)
          expect(titles.some((title) => / Two$/.test(title?.trim()))).to.be.true
        })
        .then(($actions) => {
          const result = [...$actions].find((action) => / Two$/.test(action.shadowRoot.querySelector(".ninja-title").textContent.trim()))
          tapOnScreen(Cypress.$(result.shadowRoot.querySelector(".ninja-action")))
        })

      cy.url().should("include", "/d/two")
    })

    it("opens a recently updated document from the dashboard", () => {
      cy.visit("/")
      cy.get("button#recently-updated").realTouch()
      cy.get("#recently_updated_list").contains("a", "Two").should("be.visible").realTouch()

      cy.url().should("include", "/d/two")
      cy.waitForEditor()
    })

    it("edits a paragraph and saves the document", () => {
      cy.intercept("POST", "/d/*/versions").as("saveVersion")
      // Two has a saved version, so it opens for reading; One has none and opens in the editor
      cy.visit("/d/two")
      cy.waitForEditor()

      cy.get("[aria-label='Edit document']").realTouch()
      cy.url().should("include", "/d/two/edit")
      cy.waitForEditor()
      cy.get("[data-document-editor] [role='textbox']").first().realTouch()
      cy.focused().type("{moveToEnd} Written on a phone.")
      cy.get("[aria-label='Save document']").should("not.be.disabled").realTouch()

      cy.wait("@saveVersion")
      cy.get("[aria-label='Edit document']").should("exist")
      cy.get("[data-document-editor]").should("contain", "Written on a phone.")
    })

    describe("comments", () => {
      const startComment = () => {
        cy.visit("/d/two")
        cy.waitForEditor()
        cy.contains("turbo-frame#add_object_comment a", "Comment").realTouch()
        cy.get("turbo-frame#new_object_comment [role='textbox']").should("be.visible").realTouch()
      }

      const addComment = () => {
        cy.intercept("POST", "/comments*").as("createComment")
        cy.contains("turbo-frame#new_object_comment input[type=submit]", "Add").realTouch()
        cy.wait("@createComment")
      }

      it("comments on a document", () => {
        startComment()
        cy.focused().type("Commented from a phone")
        addComment()

        cy.get("turbo-frame#object_comments").should("contain", "Commented from a phone")
      })

      it("mentions a user in a comment", () => {
        startComment()
        cy.focused().type("Have a look @Stef")
        cy.contains(".bn-suggestion-menu-item", "Stefan").should("be.visible").realTouch()
        addComment()

        cy.get("turbo-frame#object_comments").should("contain", "Have a look").and("contain", "Stefan")
      })
    })

    it("reacts to a document", () => {
      cy.intercept("POST", "/reactions*").as("addReaction")
      cy.visit("/d/two")
      cy.waitForEditor()

      cy.get(".create-reaction-button").should("be.visible").realTouch()
      cy.get("[data-emoji-picker-target='pickerContainer'] em-emoji-picker")
        .shadow()
        // The last match is in the full list; "Frequently used" above it may hold one too
        .find("button[aria-label='😀']")
        .last()
        .should("be.visible")
        .then(tapOnScreen)

      cy.wait("@addReaction")
      cy.get(".destroy-reaction-button").should("contain", "😀")
    })

    describe("tables", () => {
      beforeEach(() => {
        cy.intercept("PUT", "/t/projects/update_by_rowstack").as("updateTable")
        cy.visit("/t/projects")
        cy.get(".edit-table-button").realTouch()
        cy.contains("Changes are saved automatically").should("be.visible")
      })

      it("adds a row", () => {
        cy.appEval(`Table.find("projects").rows.count`).then((count) => {
          cy.contains("New row").realTouch()
          cy.wait("@updateTable")
          cy.contains(`${count + 1} rows`).should("exist")
        })
      })

      // A cell opens for editing on a double-click. Chrome turns a double tap into one; whether
      // iOS Safari does, rather than zooming, needs a real device.
      it("edits a cell with a double tap", () => {
        cy.contains("[role='gridcell']", "MON").realTouch()
        cy.contains("[role='gridcell']", "MON").realTouch()
        cy.focused().should("have.class", "rs-input").clear().type("TAPPED")
        cy.contains("[role='gridcell']", "JIRA").realTouch()

        cy.wait("@updateTable")
        cy.contains("[role='gridcell']", "TAPPED").should("exist")
      })
    })

    it("opens the notifications from the top bar", () => {
      cy.appScenario("create_document_with_user_mention", { space_id: "is_default", organization_id: "is", user_email: "pawel@ikigai.systems" })
      cy.visit("/d/one")
      cy.waitForEditor()

      cy.get("[data-testid='notifications-button']").should("be.visible").realTouch()
      cy.url().should("include", "/#mentions")
      cy.get("button#mentions").should("have.class", "active-tab")
      cy.get("#mentions_list").should("contain", "Document with Mention")
    })
  })
})
