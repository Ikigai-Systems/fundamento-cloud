import { isOrganizationCookie } from "../../support/organization-cookies.js"
import { assertAlignedRows, assertEqualHeights, assertIconInSlot, objectIconContent, rowsOf } from "../../support/alignment.js"

// Object rows list one under another with an icon or a title emoji in a fixed .object-icon
// slot. The labels must start at the same x in every row and the icon or emoji must stay
// inside its slot, whatever is in it: emoji are wider than the icons, and ZWJ sequences
// (👨‍👩‍👧) and flags (🇵🇱) are the likeliest to come out wider still, as several glyphs
// side by side, where a font doesn't know them. Lives under devices/ so it runs in the desktop,
// phone and landscape-tablet legs alike; it does not skip on any profile.
const LONG_TITLE = "A document title long enough to be truncated in the sidebar instead of wrapping."

describe("Object icon alignment", function () {
  beforeEach(() => {
    cy.app("clean")
    cy.appFixtures({
      fixtures_dir: "spec/fixtures",
      fixtures: ["organizations", "users", "organization_memberships", "spaces"],
    })
    cy.appEval(`
      space = Space.find("is_default")
      documents = {
        "align_plain" => "Plain document",
        "align_launch" => "🚀 Launch plan",
        "align_family" => "👨‍👩‍👧 Family document",
        "align_flag" => "🇵🇱 Flag document",
        "align_long" => ${JSON.stringify(LONG_TITLE)},
      }.map do |id, title|
        Document.create!(id: id, title: title, organization_id: "is", space: space)
      end
      Table.create!(id: "align_table", name: "Plain table", organization_id: "is", space: space)
      Table.create!(id: "align_sales", name: "📊 Sales table", organization_id: "is", space: space)
      space.update!(hierarchy: documents.map { |document| { "id" => document.id, "children" => [] } })

      membership = OrganizationMembership.find("om_is_pawel")
      membership.favorites.create!(object: Document.find("align_plain"))
      membership.favorites.create!(object: Document.find("align_launch"))
    `)
    cy.loginWithSession("pawel@ikigai.systems", "password")
    cy.setCookie("organization_id", isOrganizationCookie)
  })

  it("aligns labels across the sidebar's Documents and Tables lists", function () {
    cy.visit("/d/align_plain")

    // One comparison for both sections: a table row must start its icon and label where a
    // document row does.
    cy.openSidebar().find(".section-content-list > li").should("have.length", 7).then(($rows) => {
      assertAlignedRows(rowsOf($rows, "span.truncate"))
      assertEqualHeights($rows)
    })
  })

  it("aligns labels in the sidebar's starred tab", function () {
    cy.visit("/d/align_plain")

    cy.openSidebar().find("#starred").click()
    cy.get("#space_starred_list .content-link-container").should("have.length", 2).then(($rows) => {
      assertAlignedRows(rowsOf($rows, ".font-semibold"))
      assertEqualHeights($rows)
    })
  })

  it("aligns labels in the favorites tab", function () {
    cy.visit("/")

    cy.get("#favorites").click()
    cy.get("#favorites_list > div").should("have.length", 2).then(($rows) => {
      assertAlignedRows(rowsOf($rows, ".font-semibold a"))
      assertEqualHeights($rows)
    })
  })

  // ninja-keys draws each row in a shadow root of its own: ninja-keys > ninja-action >
  // .ninja-icon (an svg, or a span holding the title emoji) and .ninja-title.
  it("aligns labels in command palette results", function () {
    cy.visit("/")
    cy.intercept("GET", "/search*").as("paletteSearch")
    cy.window().then((win) => win.dispatchEvent(new win.CustomEvent("command-palette:open")))
    cy.get("ninja-keys").shadow().find(".modal").should("have.class", "visible")
    cy.get("ninja-keys").shadow().find("ninja-header").shadow().find("#search").type("document")
    cy.wait("@paletteSearch")

    cy.get("ninja-keys").shadow().find("ninja-action")
      .should(($actions) => {
        const titles = [...$actions].map((action) => action.shadowRoot.querySelector(".ninja-title").textContent)
        // Plain, family, flag and the long title, which the palette truncates from the front.
        expect(titles.filter((title) => title.includes("Default IS")), "results").to.have.length(4)
      })
      .then(($actions) => {
        const rows = [...$actions].map((action) => {
          const slot = action.shadowRoot.querySelector(".ninja-icon")
          let icon = slot
          if (slot.tagName.toLowerCase() === "span") {
            icon = slot.ownerDocument.createRange()
            icon.selectNodeContents(slot)
          }
          return { slot, icon, label: action.shadowRoot.querySelector(".ninja-title") }
        })
        assertAlignedRows(rows)
        assertEqualHeights([...$actions])
      })
  })

  // The switcher's label is bare text beside the slot, so the slot sits on the text's
  // baseline rather than in a flex row that centres it.
  it("centres the space switcher's icon on the space name", function () {
    cy.visit("/d/align_plain")

    cy.openSidebar().find("#spaces-dropdown .object-icon").then(($slot) => {
      const slot = $slot[0]
      // The first text after the slot. Development wraps ERB output in spans of its own,
      // so this doesn't assume the name is the slot's next sibling.
      const walker = slot.ownerDocument.createTreeWalker(slot.parentElement, NodeFilter.SHOW_TEXT)
      walker.currentNode = slot
      let text = walker.nextNode()
      while (text && (!text.textContent.trim() || slot.contains(text))) text = walker.nextNode()
      const start = text.textContent.search(/\S/)
      const label = slot.ownerDocument.createRange()
      label.setStart(text, start)
      label.setEnd(text, text.textContent.trimEnd().length)

      expect(label.toString()).to.equal("Default IS")
      assertIconInSlot({ slot, icon: objectIconContent(slot), label })
    })
  })

  // The slot is taller than the line of a large heading (a 36px title on a 40px line), so
  // without care it stretches the heading and pushes the page down. Whole lines only: the
  // heading wraps on a phone, the height must be a multiple of its line-height.
  it("keeps the History heading a whole number of lines when the title has an icon", function () {
    for (const id of ["align_plain", "align_launch"]) {
      cy.visit(`/d/${id}/versions`)
      cy.get("h1").should("contain.text", "History").then(($h1) => {
        const height = $h1[0].getBoundingClientRect().height
        const line = parseFloat(getComputedStyle($h1[0]).lineHeight)
        const lines = Math.round(height / line)
        expect(height, `${id} heading height for ${lines} line(s) of ${line}px`).to.be.closeTo(lines * line, 0.5)
      })
    }
  })
})
