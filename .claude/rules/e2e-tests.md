# E2E Tests (Cypress)

## Running specs

- Never run multiple Cypress specs in parallel against the same E2E database — `cy.app("clean")` in `beforeEach` wipes all tables, causing cross-spec interference.
- Use `bin/dev-e2e up --test` to run the full suite, or `npx cypress run --project spec/e2e --spec <path> --config baseUrl=http://localhost:4000` for individual specs.

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

## Stability verification

A test is considered stable if it passes 10 consecutive solo runs:
```bash
for i in $(seq 1 10); do
  npx cypress run --project spec/e2e --spec "<path>" --config baseUrl=http://localhost:4000 || break
done
```
