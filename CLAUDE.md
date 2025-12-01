# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Starting the Application
```bash
bin/dev
```
This runs the full development stack via Foreman with:
- Rails app on port 3000
- Formula evaluation micro-service on port 3001
- Rails API server on port 3002
- Vite dev server on port 3036
- Good Job to process background jobs


### Running Tests
```bash
# RSpec unit tests
bundle exec rspec

# Run specific test file
bundle exec rspec spec/models/space_spec.rb

# E2E tests (requires Docker setup)
RAILS_ENV=test docker compose -p e2e-tests up
npx cypress run --project spec/e2e
npx cypress open --project spec/e2e

# Clean up E2E containers
docker compose -p e2e-tests down --remove-orphans --rmi local
```

### Code Quality
```bash
# JavaScript/TypeScript linting
npm run lint

# Build frontend assets
npm run build
```

### Database Operations
```bash
# Setup database
rails db:prepare

# Run migrations
rails db:migrate

# Reset database with seeds
rails db:reset
```

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

### Micro-Services Architecture
Three Node.js services handle specialized processing:

1. **Formula Evaluation** (`micro-services/formula-eval/`, port 3001)
   - ANTLR4-based formula parser
   - Supports complex calculations with date, string, logical, and table operations

2. **BlockNote Converter** (`micro-services/blocknote-converter/`)
   - Document format conversions

3. **BlockNote Service** (`micro-services/blocknote/`)
   - Document block manipulation

### Real-Time Collaboration
- **Y.js (Yjs)** for conflict-free document editing
- **ActionCable WebSockets** for real-time sync
- **IndexedDB** for offline persistence
- Live cursors, comments, reactions, and user presence

### Frontend Technology Stack
- **Vite** build tool with HMR for Stimulus controllers
- **BlockNote** rich text editor (similar to Notion)
- **TailwindCSS** with custom design system
- **Hotwire (Turbo/Stimulus)** for enhanced Rails views
- **React Query** for server state management

### Authorization & Security
- **Pundit policies** for authorization
- **Devise** for user management (password and Google SSO)
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

### Docker Development
```bash
# Run with environment variables
SECRET_KEY_BASE=abcdef docker-compose up

# Run only infrastructure services
docker compose up redis postgresql
```

## Code formatting

Whenever possible, use the following rules:
- strings should be put into double-quotes
- don't add indentation spaces on empty lines

## Secrets Management

This project uses SOPS (Secrets OPerationS) with age encryption instead of git-crypt.

### Quick Reference

- **Secret files**: `config/secrets/*.sops.yaml` (encrypted in git)
- **View secrets**: `sops -d config/secrets/development.sops.yaml`
- **Edit secrets**: `sops config/secrets/development.sops.yaml`
- **Extract value**: `sops -d --extract '["fontawesome"]["auth_token"]' config/secrets/development.sops.yaml`

### In Application Code

Access secrets via the SOPS initializer:

```ruby
# Direct SOPS access
Rails.application.sops.dig("fontawesome", "auth_token")

# Access via credentials namespace
Rails.application.sops.credentials[:mailtrap][:username]

# Backward compatible - Rails.application.credentials is overridden to use SOPS
Rails.application.credentials[:mailtrap][:username]  # Works automatically!

# Helper methods
Rails.application.sops.fontawesome_token
Rails.application.sops.minio_access_key
```

**Note**: `Rails.application.credentials` is overridden to return SOPS credentials, ensuring gems that expect Rails credentials work without modification.

**See [SECRETS.md](SECRETS.md) for complete documentation.**

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
