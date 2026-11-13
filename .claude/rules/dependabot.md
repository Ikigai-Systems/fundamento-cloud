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
