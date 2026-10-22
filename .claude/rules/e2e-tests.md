# E2E Tests (Cypress): running and judging results

## Project and port depend on the checkout

The main checkout runs Compose project `e2e-tests` on port 4000. A git worktree runs its own
project on its own port, so several worktrees can run E2E at once. The commands here use `$P` and
`$URL`; set them first:

```bash
eval "$(bin/worktree info --format shell)"
P=$WORKTREE_E2E_PROJECT URL=http://localhost:$WORKTREE_E2E_PORT
```

`cy.app("clean")` wipes only its own stack's database, so worktrees never interfere with each other.
Without a display, Cypress always starts Xvfb on `:99`, so a second headless run fails with
"Display :99 is already in use". `bin/dev-e2e test` wraps it in `xvfb-run -a`; do the same when
calling `npx cypress run` directly.

## Running specs

- The E2E images bake the source in: the `website` service builds from context with no volume
  mounts. `bin/dev-e2e up --no-build` runs the **previous** image and silently tests stale code, so
  rebuild after changing app code. The same goes for a bare `bin/dev-e2e test`: views, stylesheets
  and JS are served from the image.
- **A successful rebuild can still ship old code**, when the `COPY . .` layer cache-hits. The run
  then fails confidently on code you already fixed, while tests that pass under the old code stay
  green, so it reads like a real bug. Before believing a red run on code you just changed, prove
  the image has it:
  ```bash
  docker compose -p $P exec -T website sh -c 'grep -n NEW_SYMBOL app/javascript/path/file.ts'
  docker compose -p $P exec -T website sh -c 'grep -rl "new-event-name" public/vite/assets'
  ```
  When only JS/TS changed, `bin/vite build` on the host, then
  `docker cp public/vite $P-website-1:/rails/public/` and
  `docker compose -p $P restart website` takes minutes instead of a full image build. The
  container is hand-patched afterwards, so rebuild before trusting a final result.
- Every remaining spec failing in under a second (1 failing, the rest skipped) means the app is
  unreachable, e.g. the stack was stopped mid-run, not a regression.

- Cypress runs from the root `node_modules`, which a fresh worktree doesn't have: run `npm ci` at
  its root first. Without it every spec fails to compile ("Can't resolve 'cypress-real-events'")
  and reports 0 tests, 1 failing, which is not a real result.
- Never run multiple Cypress specs in parallel against the same E2E database — `cy.app("clean")` in `beforeEach` wipes all tables, causing cross-spec interference.
- Use `bin/dev-e2e up --test` to run the full suite, or `npx cypress run --project spec/e2e --spec <path> --config baseUrl=$URL` for individual specs.

## Stability verification

A test is considered stable if it passes 10 consecutive solo runs:
```bash
for i in $(seq 1 10); do
  npx cypress run --project spec/e2e --spec "<path>" --config baseUrl=$URL || break
done
```

Local runs can be much noisier than CI, so a spec that goes red locally is not proof the spec is
wrong. Run an untouched master spec 5–10× on the same stack first and compare rates; if yours is at
or above that baseline, push and read CI instead of contorting the spec.

## Flaky or real? Known signatures

- `tables/table-crud-operations.cy.js`, "allows adding a new row to the table", timing out on a
  `div.items-center.flex.w-20.justify-center` becoming visible: flaky on master too.
- `PG::TRDeadlockDetected ... AccessExclusiveLock` in **any** spec's `before each`: a harness race.
  `cy.app("clean")` truncates, and `TRUNCATE` deadlocks against a connection still writing (a
  background job or the previous spec's in-flight request). Match on the message, not the spec.
- `documents/document-editing-sessions.cy.js` is **not** flaky. It passes deterministically on
  master; a failure there means real-time collaboration is broken (it caught the BlockNote 0.52
  sync regression).

To decide flaky vs. regression, run the spec 3–5× on the PR branch **and** on master on the same
machine. Don't infer flakiness from one CI run, or from sitting next to a genuinely flaky spec.

Patterns for writing specs are in `e2e-writing-specs.md`, which loads with any file under `spec/e2e/`.
