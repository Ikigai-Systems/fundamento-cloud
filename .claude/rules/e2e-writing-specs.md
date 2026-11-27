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

**Wait for the page's stream subscriptions first.** A broadcast is not replayed to a subscriber that connects after it was sent, and a frame's subscription is confirmed a WebSocket round trip after its content renders. `cy.get(".object-reactions-container")` being visible therefore does not mean a broadcast will arrive: a spec that changes data right then loses the race whenever the page starts slowly. A heavier analytics script made it lose most of the time. Call `cy.waitForStreams()` (frames loaded, every `turbo-cable-stream-source` `connected`) after the visit and before the `appEval`. Waiting for the layout's own stream is not enough: it connects first and says nothing about the frames'. Only specs that change data from the backend and expect the page to follow need it; a test that seeds before visiting does not.

## Select text the way a person does

In edit mode the editor owns the selection. A range set straight on the DOM (`selection.addRange`) is overwritten by the editor a moment later, on a loaded runner within 20 ms and before any click, so what follows (a button that shows for a selection, a quote read from it) finds nothing. Select with real input: `realClick({position: "left", clickCount: 2})` on the first word. In a read-only document the editor does not touch the selection, so setting a range there is fine.

## Reading a failure that only happens on CI

CI prints only the first line of an error, so a multi-line message looks like one word. To see what the page did, record events in the page (`cy.visit(url, {onBeforeLoad})` listeners for `selectionchange`, mouse events and Turbo fetches, with timestamps), throw them from the test as the error message, and read the full text from the `cypress-results-*` artifact (the JUnit XML), not from the log. Dispatch the E2E workflow on a scratch branch (`gh workflow run run-e2e-tests.yaml --ref <branch>`) to get that without opening a PR. Look at the order of events, not the end state: the order is what a throttled local run reproduces and what a screenshot hides.

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
