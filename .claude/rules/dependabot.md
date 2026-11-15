# Dependabot sweep: what is specific to this repo

The method is the `dependabot-triage` skill from the `dependabot` plugin in
`Ikigai-Systems/release-kit` (`dependabot@release-kit`). It reads this file first.

## Shape of the batch

Dependabot runs weekly (Friday) across four ecosystems: bundler `/`, npm `/`, npm
`/micro-services/blocknote-converter`, and github-actions. The groups and `ignore` entries
in `.github/dependabot.yml` are the record of decisions already made; each ignore carries
the condition for removing it.

## Baseline: flaky or real

The known flaky specs and their signatures are in `.claude/rules/e2e-tests.md`; that file
is the single list. One nuance for a sweep: `documents/document-editing-sessions.cy.js`
carries `retries: {runMode: 2}` for a CI-runner delay whose signature is
`Edit by <email> was not recorded server-side in time`. Any other message from it is a
regression. A bot PR's checks expire once anything merges to master: see
`.claude/rules/ci-merge-order.md`.

## Who merges what

- **Dependabot's PRs** (green, on a fresh run) are merged during the sweep without asking.
- **A PR that fixes the Dependabot setup itself** (`.github/dependabot.yml` ignores and groups,
  this file) is merged by the sweep as soon as it is green, without waiting for the user.
- Either way, re-check the PR against current master right before merging
  (`ci-merge-order.md`): a green report expires when anything merges.
- **A dependency bump written by hand** (a replacement for a broken bot PR) is a code change:
  open it and leave the merge to the user.

## E2E artifacts

The failing run uploads a screenshot with the command log and network panel, plus
`docker-compose-app-logs` for the server side. Read them before calling a red spec a flake.

## Gotchas

- **`micro-services/blocknote-converter` is a separate npm project**: see
  `.claude/rules/blocknote-converter.md`.
- **The converter pins its own `@blocknote/core`**, separately from the app's. Read API
  source from the `node_modules` of the project you are changing.
- **React 18 to 19 is deliberately deferred.** A bump whose peer range demands React 19
  (`@mantine/core` 9, and others as they land) belongs to that migration: reject it and
  reference the existing React ignore entries.
- Ruby PRs: run `bin/rspec` rather than trusting the bot.
- **`devise_invitable` bumps need a review, not just green CI.** Invitations run on the gem's
  deferred mode with a few overrides in `User` (`invitation_taken?`, `block_from_invitation?`,
  the `before_invitation_created` callback), which lean on methods the gem doesn't document. The
  Gemfile pins `~> 3.1.0` on purpose: a minor bump is a deliberate review. Before merging one,
  read the gem's CHANGELOG for changes to invitation lookup (`find_by_invitation_token`,
  `current_invitation`), callbacks, `invitation_taken?`, `block_from_invitation?`, and how
  invitations link to existing users. Then run the "organization invitations" section of
  `spec/models/user_spec.rb`, `spec/requests/invited_users/` and
  `spec/e2e/cypress/e2e/organization/organization-invitations.cy.js`. The user-spec section is the
  early warning: it fails first if a registered user with a pending invitation could be locked out.
- **A cancelled run shows up as a failure.** A superseded run reports
  `run-e2e-tests (${{ matrix.device }}${{ ... }})` as `fail` after 0s, with the annotation
  "Canceling since a higher priority waiting request". It appears on every PR and is not
  a result: judge the per-device `run-e2e-tests (desktop 1/4)` jobs instead.
- **A bot's npm lockfile can fail `npm ci`** with `Missing: @emnapi/core@... from lock file`
  (optional peers of a wasm binding that npm only writes on a regenerate), so every
  job dies in seconds. A rebase does not fix it. Replace the PR with one from current master
  that keeps the bot's `package.json` changes except `version` (release-please owns it) and
  regenerates the lock with `npm install`, then check `npm ci`, `npm run typecheck` and
  `npm run lint`. Close the bot PRs with a pointer.
- **A `@dependabot rebase` can go unanswered for over an hour** (the head SHA never changes).
  `@dependabot recreate` regenerates the PR from current master.
- **`tailwindcss-rails` 4 and `tailwindcss-ruby` 4 are one migration**: both majors are ignored
  in `.github/dependabot.yml` until the Tailwind 4 work.
