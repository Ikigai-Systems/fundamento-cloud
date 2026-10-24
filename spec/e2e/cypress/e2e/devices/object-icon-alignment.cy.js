import { isOrganizationCookie } from "../../support/organization-cookies.js"
import { assertAlignedRows, objectIconContent } from "../../support/alignment.js"

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

  const expectEqualHeights = ($rows) => {
    const heights = [...$rows].map((row) => row.getBoundingClientRect().height)
    expect(new Set(heights).size, `row heights ${heights.join(", ")}`).to.equal(1)
  }

  it("aligns labels in the sidebar tree", function () {
    cy.visit("/d/align_plain")

    cy.openSidebar().find("li[data-node-id]").should("have.length", 5).then(($rows) => {
      assertAlignedRows([...$rows].map((row) => {
        const slot = row.querySelector(".object-icon")
        return { slot, icon: objectIconContent(slot), label: row.querySelector("span.truncate") }
      }))
      expectEqualHeights($rows)
    })
  })

  it("aligns labels in the sidebar's tables list", function () {
    cy.visit("/d/align_plain")

    cy.openSidebar().find(".section-content-list > li:not([data-node-id])").should("have.length", 2).then(($rows) => {
      assertAlignedRows([...$rows].map((row) => {
        const slot = row.querySelector(".object-icon")
        return { slot, icon: objectIconContent(slot), label: row.querySelector("span.truncate") }
      }))
      expectEqualHeights($rows)
    })
  })

  it("aligns labels in the sidebar's starred tab", function () {
    cy.visit("/d/align_plain")

    cy.openSidebar().find("#starred").click()
    cy.get("#space_starred_list .content-link-container").should("have.length", 2).then(($rows) => {
      assertAlignedRows([...$rows].map((row) => {
        const slot = row.querySelector(".object-icon")
        return { slot, icon: objectIconContent(slot), label: row.querySelector(".font-semibold") }
      }))
      expectEqualHeights($rows)
    })
  })

  it("aligns labels in the favorites tab", function () {
    cy.visit("/")

    cy.get("#favorites").click()
    cy.get("#favorites_list > div").should("have.length", 2).then(($rows) => {
      assertAlignedRows([...$rows].map((row) => {
        const slot = row.querySelector(".object-icon")
        return { slot, icon: objectIconContent(slot), label: row.querySelector(".font-semibold a") }
      }))
      expectEqualHeights($rows)
    })
  })
})
