// Turns the browser into a touch device when the run is `--expose device=phone|tablet`.
//
// A narrow viewport alone is not a touch test: the page still reports `(hover: hover)`
// and `(pointer: fine)`, so hover-only controls look fine. Chrome's touch emulation
// flips those media queries, sets `navigator.maxTouchPoints`, and turns mouse input
// into touch events — the same switch as DevTools' device mode.
//
// Note that `cy.click()` still dispatches synthetic mouse events, hover included, so a
// spec that passes on `phone` with `.click()` has not proved a finger can do it. Use
// `.realTouch()` (cypress-real-events) when the touch itself is what's under test.

export const deviceName = () => Cypress.expose("device") || "desktop"
export const isTouch = () => Cypress.expose("touch") === true

const sendCdp = (command, params) =>
  Cypress.automation("remote:debugger:protocol", { command, params })

beforeEach(() => {
  if (!isTouch()) return

  cy.wrap(null, { log: false }).then(() =>
    Promise.all([
      sendCdp("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 }),
      sendCdp("Emulation.setEmitTouchEventsForMouse", { enabled: true, configuration: "mobile" }),
    ]),
  )
})
