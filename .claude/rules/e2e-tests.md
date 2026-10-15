# E2E Tests (Cypress): running and judging results

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
  docker compose -p e2e-tests exec -T website sh -c 'grep -n NEW_SYMBOL app/javascript/path/file.ts'
  docker compose -p e2e-tests exec -T website sh -c 'grep -rl "new-event-name" public/vite/assets'
  ```
  When only JS/TS changed, `bin/vite build` on the host, then
  `docker cp public/vite e2e-tests-website-1:/rails/public/` and
  `docker compose -p e2e-tests restart website` takes minutes instead of a full image build. The
  container is hand-patched afterwards, so rebuild before trusting a final result.
- Every remaining spec failing in under a second (1 failing, the rest skipped) means the app is
  unreachable, e.g. the stack was stopped mid-run, not a regression.

- Never run multiple Cypress specs in parallel against the same E2E database — `cy.app("clean")` in `beforeEach` wipes all tables, causing cross-spec interference.
- Use `bin/dev-e2e up --test` to run the full suite, or `npx cypress run --project spec/e2e --spec <path> --config baseUrl=http://localhost:4000` for individual specs.

## Stability verification

A test is considered stable if it passes 10 consecutive solo runs:
```bash
for i in $(seq 1 10); do
  npx cypress run --project spec/e2e --spec "<path>" --config baseUrl=http://localhost:4000 || break
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
