# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Context includes also:
@README.md

## Running commands

When possible use scripts from `bin/` instead of using `bundle exec`. For example `bin/rails`, `bin/rspec`, `bin/rake`, etc.

`micro-services/blocknote-converter` is a separate npm project with its own `typecheck`,
`lint` and `test` — the app's `npm run typecheck` does not cover it, and its `npm run build`
uses esbuild, which does not typecheck. See `.claude/rules/blocknote-converter.md`.

## Architecture Overview

### Core Application Structure
Fundamento is a collaborative workspace platform (similar to Notion/Airtable) built with:
- **Ruby on Rails 8.1** backend with PostgreSQL
- **React 18 + TypeScript** frontend via Vite
- **Real-time collaboration** using Y.js CRDTs and ActionCable WebSockets
- **Multi-tenant architecture** with Organizations as the root entity

### Key Domain Models
- **Organization** - Multi-tenant root with users, spaces, teams
- **Space** - Workspace containers with hierarchical document structure
- **Document** - Rich text with BlockNote editor and version history
- **Table** - Spreadsheet-like data with columns, rows, cells, and formulas
- **Automation** - Workflow automation with formula evaluation

### Non-predictable IDs
The application uses **Nanoid** to generate non-predictable IDs for models (instead of the default Rails sequential IDs) for clean, secure URLs:
- Documents: `/d/abc123`
- Tables: `/t/xyz789`
- Spaces: `/s/def456`

All new Rails models should follow this pattern for consistent URL generation - primary keys should be strings (id field), not integers. Database default should be set to UUID, but models should override it to use a shorter unique identifier for cleaner URLs.

**Notice:** Don't assume all models have string IDs as there are still models that use the default integer auto-incremented IDs.  

### Micro-Services Architecture
Node.js services handle specialized processing:

1. **BlockNote Converter** (`micro-services/blocknote-converter/`)
   - Document format conversions

### Real-Time Collaboration
- **Y.js (Yjs)** for conflict-free document editing
- **ActionCable WebSockets** for real-time sync
- **IndexedDB** for offline persistence
- Live cursors, comments, reactions, and user presence

### Frontend Technology Stack
- **Vite** build tool with HMR for Stimulus controllers
- **BlockNote** rich text editor (similar to Notion)
- **TailwindCSS** with custom design system (the latest 3.x version)
- **Hotwire (Turbo/Stimulus)** for enhanced Rails views
- **React Query** for server state management
- **react_component** helper: snake_case props in ERB are auto-converted to camelCase in React
- **js_from_routes**: auto-generates `app/javascript/api/*.js` from Rails routes — commit these when routes change

### Authorization & Security
- **Pundit policies** for authorization
- **Devise** for user management (password and Google SSO)
- **Rails encrypted credentials** for per-environment secret management
- **API tokens** for programmatic access
- **Space-level access controls** (public, restricted, private)

### Key File Locations
- `/app/models/` - ActiveRecord models with business logic
- `/app/controllers/api/v1/` - API endpoints
- `/app/policies/` - Pundit authorization policies
- `/app/services/` - Business logic services
- `/app/javascript/components/` - React components
- `/app/javascript/api/` - Type-safe API client code
- `/config/routes.rb` - Routing with NPI support

### Development Notes
- Uses **ViewComponent** for reusable UI elements
- **Good Job** for background processing
- **ActiveStorage** with MinIO (S3-compatible) for file storage
- **Document content** lives in `object_contents`, not on `documents`: read
  `document.content.sync`, write through `document.content_or_build`. The `documents.sync`
  column was dropped — code or specs still naming it will fail with
  `unknown attribute 'sync'`.
- **Feature flags** via Flipper
- **Error tracking** with Sentry

## Git Worktrees

Worktrees are stored in `.claude/worktrees/` (gitignored). The path matters: anything outside `.claude/` doesn't inherit this project's `.claude/settings.local.json` permission allow-list when Claude is launched from inside the worktree, leading to repeated permission prompts for commands that should be auto-allowed.

Before running specs or the app in a new worktree, run:

```bash
bin/worktree setup
```

It copies the gitignored files listed in `.worktreeinclude` from the main checkout (Claude Code
already does this for worktrees it creates), generates `config/database.yml` from
`config/database.yml.sample`, and runs `bundle install`, `npm ci` (root and
blocknote-converter), the converter build and the Tailwind build. Each step is skipped when its
inputs haven't changed, so rerunning it is cheap; `--force` reruns everything. A new gitignored
file that worktrees need goes into `.worktreeinclude`, not into a manual copy step.

Every worktree copies from the main checkout, so keep it current: `git pull --ff-only` there
before starting worktrees. The keys in `config/credentials/` are gitignored, so a pull alone
keeps the old one after a credentials key rotation (a change to `config/secrets/*.sops.yaml`).
Worktrees then copy a key that can't decrypt their branch's credentials, and `bin/worktree
setup` fails with `ActiveSupport::MessageEncryptor::InvalidMessage`. The fix is `bin/setup` in
the main checkout, which needs a human (it signs in to 1Password): don't run it, ask the user
to.

Each linked worktree gets its own databases: `fundamento_development_wt_<id>` (created and
seeded on the first `setup`, migrated after that) and `fundamento_test_wt_<id>`. So `bin/rspec`
can run in several checkouts at once, and `bin/dev` in a worktree runs that branch's migrations
and background jobs against its own data (Postgres must be running: `docker compose up -d
--wait postgresql redis` from the main checkout).

A worktree also gets a slot with its own dev server ports (Rails on `20000 + slot * 10`, Vite
+1, blocknote-converter +2) and a Redis key prefix `wt_<id>:`. `setup` writes them to
`.env.development.local`, which `bin/dev` loads after `.env`. So `bin/dev` can run in several
checkouts at once; `bin/worktree info` shows the URL to open (the main checkout keeps port
3000). `bin/dev` runs `bin/worktree setup` itself in a worktree and always uses the main
checkout's Compose project, so every checkout shares one set of containers and one Redis.

`bin/dev-e2e` in a worktree runs its own Compose project, `fundamento-e2e-wt-<id>`, built from
that worktree's code, with Rails on `22000 + slot * 10` (Postgres +1, Redis +2, MinIO +3/+4).
`bin/dev-e2e test` points Cypress at it, so E2E runs in several worktrees at once. The main
checkout keeps `e2e-tests` on port 4000. `bin/worktree info` shows the project and port.

Databases, slots and Redis prefixes are recorded per worktree in `.git/fundamento-worktrees.json`.
`bin/worktree setup` cleans up after worktrees that are gone (drops their databases, deletes
their Redis keys, removes their E2E stack with its volumes and images, frees their slot),
`bin/worktree gc [--dry-run]` does only that, and `bin/worktree list` shows what exists. Only
databases named with the `_wt_` marker, keys under a `wt_<id>:` prefix and Compose projects named
`fundamento-e2e-wt-<id>` recorded by this clone are ever removed.

Keep the worktree when opening a PR, so review follow-ups don't need it set up again. When
removing one by hand, run `bin/worktree teardown` in it first.

### Remote control

To drive several sessions from claude.ai/code or the phone, each in its own worktree, run
`bin/remote-control` (from any checkout; extra arguments such as `--name` go to `claude
remote-control`). It switches to the main checkout, starts Postgres and Redis, runs `bin/worktree
gc`, then starts `claude remote-control --spawn=worktree --no-create-session-in-dir
--permission-mode auto`. `--no-create-session-in-dir` keeps a session from working in the main
checkout itself, where a branch switch moves HEAD for every other session. In a folder Claude
hasn't trusted yet, run `claude` there once first; there is no terminal to ask on.

A spawned session needs no manual setup: `bin/dev` sets up its worktree, and `bin/worktree
setup` is all `bin/rspec` needs. There is no display, so `bin/browser-session-for` runs Chrome
headless and `bin/dev-e2e test` runs Cypress under `xvfb-run`.

A session that ends with no changes and no new commits has its worktree removed, but its
databases, Redis keys and E2E stack stay until the next `bin/worktree gc` (any `setup` also runs
it). Run `bin/worktree gc` after a day of sessions, and `bin/worktree list` to see what is left.

## Development Seeds

Seeds use the [Oaken gem](https://github.com/kaspth/oaken) for realistic development data.

- **Entry point**: `db/seeds.rb` (calls `Oaken.seed :organizations`)
- **Setup/helpers**: `db/seeds/setup.rb` and `db/seeds/setup/` (timeline, document, table helpers)
- **Scenarios**: `db/seeds/organizations/<name>/` (each has `README.md`, `seed.rb`, `content/`)
- **Content**: Markdown documents in `content/documents/`, YAML+CSV tables in `content/tables/`
- **Generator**: `bin/generate-seed "<description>"` bootstraps new scenarios via Claude CLI

Run `bin/rails db:seed` to populate the development database. Seeds are clean-slate (destroy and recreate seed orgs on each run). Login as `sarah@brightpath.example.com` / `password` to explore.

The blocknote-converter must be built before seeds can run:

```bash
cd micro-services/blocknote-converter && npm install && npm run build
```

To add a new scenario: create a directory under `db/seeds/organizations/`, add the org name to `SEED_ORG_NAMES` and email domain to `SEED_EMAIL_DOMAINS` in `db/seeds.rb`.

## Dev Browser Sessions

Open isolated Chrome sessions pre-authenticated as any dev user:

```bash
# List available accounts
bin/browser-session-for --list

# Open a session (launches Chrome, auto-logs in)
bin/browser-session-for sarah@brightpath.example.com

# Open a second session simultaneously
bin/browser-session-for james@brightpath.example.com

# Without a window (automatic when there is no display, e.g. a remote session)
bin/browser-session-for --headless sarah@brightpath.example.com &
```

Each session gets its own Chrome profile (`tmp/browser-sessions/<email>/`) with persistent cookies. The remote-debugging port is written to `tmp/browser-sessions/<email>/debug-port` and printed to stdout, so agent-browser can drive the session:

```bash
eval "$(bin/worktree info --format shell)"
npx agent-browser --session "${WORKTREE_ID:-main}" --cdp $(cat tmp/browser-sessions/sarah@brightpath.example.com/debug-port) snapshot
```

Always pass `--session`. agent-browser runs one daemon per machine, shared by every Claude session,
and without a session name they all drive the same `default` browser connection: one session's
`open` lands in another's tab, and screenshots and checks read a page some other session loaded.

In a linked worktree the session opens that worktree's dev server (port from `bin/worktree info`) and takes debug ports from the worktree's own block (`24000 + slot * 10`, one per account, kept across launches), so sessions in several worktrees run side by side. The main checkout keeps port 3000 and debug ports 9200–9299.

Requires the Rails dev server running (`bin/dev`) and uses the `?as=<email>` backdoor (dev-only middleware) for instant login.

## Releases and changelog

Versions and `CHANGELOG.md` are automated. `version.txt` is the single source of truth
for the app version (exposed as `Fundamento::VERSION`, `GET /version`, and the Sentry
release); **release-please owns that file — never edit it by hand.**

Every PR carries its own changelog entry in its title and description. See
`.claude/rules/changelog.md` for the conventions, and run `/changelog` to classify a
change. Merging the `chore(main): release X.Y.Z` PR tags the release, which builds
semver-tagged images from `.github/workflows/package-*.yaml`.

### Deployment: two models

- **Hosted cloud deploys from `master`.** Merge → `Run Tests` → `Package: fundamento-cloud`
  (a `workflow_run` trigger) → deploy. Merging *is* deploying, and containers roll, so a
  multi-phase schema change must be split across separate merges.
- **Standalone ships versioned releases** cut by release-please and runs `db:prepare` on boot.
  Operators accept downtime for an upgrade, so a multi-phase migration can land in one release.

**Don't infer whether the cloud has a change from git tags.** Tags track only the standalone
release; a merged PR can be live on the cloud while the latest tag is older. Check the package
run instead: `gh run list --workflow package-fundamento-cloud.yaml`.

## Code formatting

Whenever possible, use the following rules:
- strings should be put into double-quotes
- don't add indentation spaces on empty lines
