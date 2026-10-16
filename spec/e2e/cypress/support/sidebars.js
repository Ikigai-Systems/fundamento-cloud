import { isTouch } from "./device"

// Below 1024px the sidebars are drawers, closed until opened from the top bar; wider screens
// show them beside the content. `cy.openSidebar()` makes a sidebar usable on any profile, so a
// journey can start in the navigation without knowing which layout it runs in:
//
//   cy.openSidebar().within(() => cy.contains("Two").click())
//   cy.openSidebar("details").find("#details").realTouch()
//
// On a narrow profile it taps the drawer's top-bar button (unless the drawer is already open)
// and waits for the slide to finish: a real tap lands at fixed coordinates, so tapping into a
// drawer that is still moving misses. On a wide profile it does nothing. Either way it yields
// the sidebar.
//
// An open drawer covers the page, so a step that goes back to the content first calls
// `cy.closeSidebar()`, which taps the dimmed backdrop beside the drawer, as a person would, and
// waits until the drawer has slid away. With no drawer open it does nothing.

const SIDEBARS = {
  navigation: { id: "space-sidebar", edge: "left" },
  details: { id: "content-sidebar", edge: "right" },
}

Cypress.Commands.add("openSidebar", (side = "navigation") => {
  const sidebar = SIDEBARS[side]
  if (!sidebar) throw new Error(`cy.openSidebar: unknown side "${side}", expected ${Object.keys(SIDEBARS).join(" or ")}`)

  const opener = `button[aria-controls='${sidebar.id}']`

  cy.get("body", { log: false }).then(($body) => {
    const $opener = $body.find(`${opener}:visible`)
    if (!$opener.length || $opener.attr("aria-expanded") === "true") return

    if (isTouch()) cy.wrap($opener, { log: false }).realTouch()
    else cy.wrap($opener, { log: false }).click()

    cy.get(opener, { log: false }).should("have.attr", "aria-expanded", "true")
    cy.get(`#${sidebar.id}`, { log: false }).should(($sidebar) => {
      const rect = $sidebar[0].getBoundingClientRect()
      const width = $sidebar[0].ownerDocument.documentElement.clientWidth
      if (sidebar.edge === "left") expect(rect.left, "drawer slid in").to.be.at.least(0)
      else expect(rect.right, "drawer slid in").to.be.at.most(width)
    })
  })

  return cy.get(`#${sidebar.id}`)
})

Cypress.Commands.add("closeSidebar", () => {
  cy.get("body", { log: false }).then(($body) => {
    const sidebar = Object.values(SIDEBARS).find(({ id }) =>
      $body.find(`button[aria-controls='${id}']:visible`).attr("aria-expanded") === "true"
    )
    if (!sidebar) return

    // The backdrop spans the whole screen under the drawer; tap the strip the drawer leaves dimmed,
    // clear of the screen edge
    const $backdrop = $body.find(".drawer-open .sidebar-backdrop")
    const { width, height } = $backdrop[0].getBoundingClientRect()
    const x = sidebar.edge === "left" ? width - 16 : 16
    const y = height / 2
    if (isTouch()) cy.wrap($backdrop, { log: false }).realTouch({ x, y })
    else cy.wrap($backdrop, { log: false }).click(x, y)

    cy.get(`button[aria-controls='${sidebar.id}']`, { log: false }).should("have.attr", "aria-expanded", "false")
    cy.get(`#${sidebar.id}`, { log: false }).should("not.be.visible")
  })
})
