# bin/dev-e2e Rewrite Design

## Problem

The E2E development workflow requires chaining multiple commands:

```bash
docker compose -p e2e-tests down && bin/dev-e2e --build && npx cypress run --project spec/e2e
```

The current `bin/dev-e2e` script only handles starting the environment. Tearing down, rebuilding, viewing logs, and accessing the container all require separate docker compose commands.

## Solution

Rewrite `bin/dev-e2e` as a Ruby Thor CLI with subcommands that encapsulate the full E2E workflow.

## Subcommands

| Command | Behavior |
|---------|----------|
| `bin/dev-e2e` (default) | Alias for `up` |
| `bin/dev-e2e up` | Down existing containers, rebuild images, start, wait for healthy |
| `bin/dev-e2e up --no-build` | Down + start without rebuilding |
| `bin/dev-e2e up --test` | Up + run Cypress tests after healthy |
| `bin/dev-e2e down` | Stop E2E containers |
| `bin/dev-e2e clean` | Remove all containers, volumes, and local images |
| `bin/dev-e2e logs` | Stream docker compose logs (Ctrl-C to exit) |
| `bin/dev-e2e console` | Rails console in the website container |
| `bin/dev-e2e shell` | Bash shell in the website container |
| `bin/dev-e2e test` | Run Cypress tests (assumes environment already running) |

## Key Design Decisions

- **Build is the default** (inverted from current `--build` opt-in) since rebuild is the most common need
- **Down before up is automatic** - no more manual teardown
- **Single self-contained file** using Thor (available via Rails transitive dependency)
- **`Kernel.exec` for interactive commands** (`console`, `shell`) to get proper TTY passthrough
- **Exit codes pass through** for CI compatibility

## Script Structure

Single file at `bin/dev-e2e` with a Thor class containing:

- `PROJECT = "e2e-tests"` constant for docker compose project name
- `setup_env!` - sets E2E port environment variables
- `load_sops_key!` - loads SOPS_AGE_KEY from secret file
- `fix_permissions!` - chmod fix for Docker COPY
- `compose(*args)` - helper wrapping `docker compose -p e2e-tests --ansi never`
- `print_status` - port info banner

## Error Handling

- Container not running for exec commands: helpful message pointing to `bin/dev-e2e up`
- SOPS key missing: early exit with instructions (same as current)
- Signal handling: terminal restore on SIGINT/SIGTERM for `up`; passthrough for exec commands
- Cypress/docker compose exit codes passed through to caller

## Port Configuration (unchanged)

| Service | Development | E2E |
|---------|-------------|-----|
| Rails | 3000 | 4000 |
| PostgreSQL | 5432 | 6432 |
| Redis | 6379 | 7379 |
| MinIO API | 9000 | 10000 |
| MinIO Console | 9001 | 10001 |
| BlockNote | 3002 | 4002 |
