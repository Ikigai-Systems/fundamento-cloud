# Dependabot sweep: what is specific to this repo

The method is the `dependabot-triage` skill from the `dependabot` plugin in
`Ikigai-Systems/release-kit` (`dependabot@release-kit`). It reads this file first.

## Shape of the batch

Dependabot runs weekly (Friday) across four ecosystems: bundler `/`, npm `/`, npm
`/micro-services/blocknote-converter`, and github-actions. The groups and `ignore` entries
in `.github/dependabot.yml` are the record of decisions already made; each ignore carries
the condition for removing it.

## Baseline: known flaky specs

Only these have earned the benefit of the doubt, and only with their own signature:

- `tables/table-crud-operations.cy.js`, "allows adding a new row to the table".
- `documents/document-editing-sessions.cy.js`: a CI-runner TCP-retransmit delay, root-caused.
  It carries its own `retries: {runMode: 2}`. The flake signature is
  `Edit by <email> was not recorded server-side in time`; any other message is a regression.

`.claude/rules/e2e-tests.md` has the rest of the flaky-or-real signatures. A bot PR's checks
expire once anything merges to master: see `.claude/rules/ci-merge-order.md`.

## E2E artifacts

The failing run uploads a screenshot with the command log and network panel, plus
`docker-compose-app-logs` for the server side. The `document-advanced-tables` spec
("cancels editing on Escape") once failed on a BlockNote bump looking like a timing flake;
the screenshot showed a `PATCH /t/:id` firing after the `{esc}` keystroke. Escape was saving
the title it should have discarded, and the spec asserted only on the rendered title, which
reverts correctly either way. A latent bug, exposed by the bump and fixed in its own PR.
Dispatching `keydown` Escape and `blur()` in the same tick reproduced it every time.

## Gotchas

- **`micro-services/blocknote-converter` is a separate npm project.** Run its `typecheck`,
  `lint` and `test` from inside it; `npm run build` uses esbuild and does not typecheck.
  See `.claude/rules/blocknote-converter.md`.
- **The converter pins its own `@blocknote/core`**, separately from the app's. Read API
  source from the `node_modules` of the project you are changing.
- **React 18 to 19 is deliberately deferred.** A bump whose peer range demands React 19
  (`@mantine/core` 9, and others as they land) belongs to that migration: reject it and
  reference the existing React ignore entries.
- **`gh pr merge --auto` merges immediately** here (`allow_auto_merge` is false). Merge
  explicitly, one PR at a time.
- Ruby PRs: run `bin/rspec` rather than trusting the bot.
