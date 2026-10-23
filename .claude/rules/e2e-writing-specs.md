---
paths:
  - "spec/e2e/**"
---

# E2E Tests (Cypress): writing specs

## Turbo Stream broadcasts after `appEval`

When `appEval` creates/updates/destroys a record that has `after_commit` broadcasts (e.g., `ObjectReaction`), the broadcast triggers an async Turbo frame reload (a GET request). The test must wait for that reload before asserting UI state.

**Single mutation:** Intercept the GET before `appEval`, wait after:
```js
cy.intercept("GET", "/reactions*").as("getReactions");
cy.appEval(`...create or destroy...`);
cy.wait("@getReactions");
cy.get(".destroy-reaction-button").should("contain", "🎉");
```

**Multiple mutations in a loop:** Do NOT intercept/wait per iteration — Turbo coalesces rapid frame reloads, so intermediate GETs may never fire. Instead, batch all mutations in a single `appEval` and assert the final DOM state:
```js
cy.appEval(`
  ["👍", "❤️", "🎉"].each do |emoji|
    record.reactions.find_or_create_by!(..., emoji: emoji)
  end
`);
cy.get(".destroy-reaction-button", { timeout: 10000 }).should("have.length", 3);
```

## Intercepts after page navigation

`cy.intercept` aliases may not carry over after a full page navigation (e.g., clicking a link that loads a new page). Re-register the intercept with a fresh alias before the next action that triggers the request:
```js
cy.intercept("GET", "/search").as("search2");
```

## Waiting for page/editor readiness

- Prefer waiting for a specific interactive element over checking absence of loading text:
  ```js
  // Fragile — passes instantly if text hasn't appeared yet
  cy.contains("Loading content").should("not.be.visible");

  // Robust — retries until editor is interactive
  cy.get("[data-document-editor] [role='textbox']", { timeout: 10000 }).should("exist");
  ```

## Turbo form submissions

When a button/link triggers a Turbo form POST (e.g., `button_to`), intercept the POST and wait before navigating or asserting:
```js
cy.intercept("POST", "/organizations/*/select").as("selectOrg");
cy.contains("Go to Organization").click();
cy.wait("@selectOrg");
```

## Don't rely on flash text for sync after a Turbo Frame save

Saves that swap the content frame (instead of doing a full page load) leave the previous flash visible in `#flashes` because it lives outside the frame. A naive `cy.contains("Document has been updated").should("be.visible")` will match the stale flash from the previous save and let the next `cy.appEval` race the in-flight POST.

Use `cy.intercept` + `cy.wait` on the POST instead — that's the only reliable sync point. Pattern:
```js
beforeEach(() => {
  cy.intercept("POST", "/d/*/versions").as("saveVersion");
});

function saveDocument() {
  cy.get('[aria-label="Save document"]').click();
  cy.wait("@saveVersion");
  // The swap lands on the document page; its sidebar loads lazily afterwards
  cy.get('[aria-label="Edit document"]').should("exist");
  cy.get("#content-sidebar .content-sidebar-tabs").should("exist");
}
```

## Register an aliased intercept once, not inside a helper called repeatedly

Calling `cy.intercept(...).as("x")` again for each action stacks intercepts under one alias, and
a later `cy.wait("@x")` can then resolve with a request an earlier wait already consumed —
returning immediately, before the action's own request has finished. Recorded on the document
editor spec: the third save's wait resolved with the second save's request, so the next step ran
against a page and database the save hadn't reached yet. Register it once in `beforeEach` (or at
the top of the test) and only `cy.wait` in the helper.

Don't count requests that other steps also trigger, either: the content sidebar reloads both when
a save lands and when the editor opens, so the nth `cy.wait` on it drifts behind. Wait for what the
page shows instead.

## A narrow viewport is not a touch device

Viewport emulation (agent-browser `set device`, Cypress `cy.viewport`) still reports `hover: hover`
and no touch, so hover-only UI and tap behaviour look fine when they aren't. Run specs with a device
profile (`--expose device=phone|tablet|tablet-landscape`, see
`spec/e2e/cypress/support/devices.cjs`) and use `realTouch` from cypress-real-events when the touch
itself is under test.

## A real tap needs a page that has stopped moving

`realTouch` reads the element's position once, then taps those screen coordinates; it has none of
`.click()`'s actionability waits. If the element moves or is replaced in between, the tap lands
beside it and nothing happens. On a slow CI runner this failed the touch journeys about one run in
thirty, always the ones that tapped right after a page change. Before tapping:

- after `cy.visit`, call `cy.waitForFrames()`: frames load after the page and push down what is
  below them (the reactions row moves the Comment link);
- after an in-page navigation, wait for the new page's own state, not just the URL: Turbo changes
  the URL before the response arrives, so the old page is still there (the document's read-only
  editor before the editable one, the read-only table grid before the editable one).

To reproduce a timing-dependent failure locally, slow the browser with Chrome's CPU throttling
(`Cypress.automation("remote:debugger:protocol", { command: "Emulation.setCPUThrottlingRate",
params: { rate: 20 } })` in a `beforeEach`), not the containers.
