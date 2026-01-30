# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Context includes also:
@README.md
@SECRETS.md

## Running commands

Whenever you want to run rails related commands use `rails` (not `bin/rails`).

To run agent-brwoser related commands use `npx agent-browser`. Use save state functionality to create cached states. Let agent-browser store them in `tmp/agent-browser` directory.

When possible use binstubs instead of using `bundle exec`.

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

## Code formatting

Whenever possible, use the following rules:
- strings should be put into double-quotes
- don't add indentation spaces on empty lines
