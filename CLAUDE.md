# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Context includes also:
@README.md

## Running commands

When possible use scripts from `bin/` instead of using `bundle exec`. For example `bin/rails`, `bin/rspec`, `bin/rake`, etc.

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

### Unique NPI System
The application uses **Nanoid Public Identifiers (NPIs)** instead of sequential IDs for clean, secure URLs:
- Documents: `/d/abc123`
- Tables: `/t/xyz789`
- Spaces: `/s/def456`

All Rails models should follow the NPI pattern for consistent URL generation - primary keys should be strings (id field), not integers. Database default should be set to UUID, but models should override it to use a shorter unique identifier for cleaner URLs.

**Exceptions:** Some models use default integer auto-increment IDs instead of NPIs: `ObjectComment`, `Version`, `ObjectReaction`. Don't assume all models have string IDs.

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
- **Feature flags** via Flipper
- **Error tracking** with Sentry

## Git Worktrees

Worktrees are stored in `.worktrees/` (gitignored). After creating a worktree, these gitignored files must be copied from the main repo and build steps must be run before tests will pass:

```bash
# Copy gitignored config files
cp config/database.yml <worktree>/config/database.yml
cp dockerfiles/sops-age-key.secret <worktree>/dockerfiles/sops-age-key.secret
cp dockerfiles/fontawesome-auth.secret <worktree>/dockerfiles/fontawesome-auth.secret
cp -r .bundle <worktree>/.bundle

# Build the blocknote-converter micro-service (used by fixtures and model code)
cd <worktree>/micro-services/blocknote-converter && npm install && npm run build

# Build Tailwind CSS (required for request/view specs)
cd <worktree> && bin/rails tailwindcss:build
```

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
```

Each session gets its own Chrome profile (`tmp/browser-sessions/<email>/`) with persistent cookies. The debug port is written to `tmp/browser-sessions/<email>/debug-port` and printed to stdout for agent-browser connectivity:

```bash
npx agent-browser --remote-debugging-port=$(cat tmp/browser-sessions/sarah@brightpath.example.com/debug-port)
```

Requires the Rails dev server running (`bin/dev`) and uses the `?as=<email>` backdoor (dev-only middleware) for instant login.

## Code formatting

Whenever possible, use the following rules:
- strings should be put into double-quotes
- don't add indentation spaces on empty lines
