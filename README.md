# Fundamento Cloud

## Prerequisites

### Secrets Management

This project uses SOPS (Secrets OPerationS) with age encryption for managing secrets. You need to:

1. Install age and sops:
   ```bash
   # macOS
   brew install age sops

   # Linux
   sudo apt-get install age
   # For sops, see SECRETS.md for installation instructions
   ```

2. Obtain the age private key from the project owner and save it to:
   ```bash
   mkdir -p ~/.config/sops/age
   # Save the private key to ~/.config/sops/age/keys.txt
   chmod 600 ~/.config/sops/age/keys.txt
   ```

**For detailed secrets management documentation, see [SECRETS.md](SECRETS.md)**

# Running

```
bin/dev
```
This is equivalent to `foreman start -f Procfile.dev` run manually.

It should spawn two processes:
* rails app listening on port `3000`
* vite devserver listening on port `3036`
* rails background job processor
* formula evaluation micro-service listening on port `3001`

Access application via `http://localhost:3000`

# Production mode

1. `rails db:prepare RAILS_ENV=production` -> once, to setup database schema
2. (re)build frontend: `npm run build` -> this will (re)populate `public` folder
3. `foreman start -f Procfile.prod`  
   This will run rails server on port `3000`

# Docker

1. To run app, provide secret_base_key as env variable:
```
SECRET_KEY_BASE=abcdef docker-compose up
```
Access application on port `3000`

## Running only selected services

```
docker compose up redis postgresql
```

Running the same docker compose again with different name: 
```
docker compose -p e2e-tests up
```

# Running tests

## E2E

E2E tests use the same `docker-compose.yml` with environment variables for port offsetting (+1000) and the `-p e2e-tests` flag for isolation.

### Quick Start

```bash
# Start E2E environment (offset ports: Rails on 4000, DB on 6432, etc.)
bin/dev-e2e

# In another terminal, run tests
npx cypress run --project spec/e2e          # Headless
npx cypress open --project spec/e2e         # Interactive
```

### Running Development and E2E Simultaneously

```bash
# Terminal 1: Local development (ports 3000, 5432, 6379, 9000/9001)
bin/dev

# Terminal 2: E2E environment (ports 4000, 6432, 7379, 10000/10001)
bin/dev-e2e

# Terminal 3: Run Cypress tests
npx cypress open --project spec/e2e
```

### Port Mapping

| Service | Development | E2E | Offset |
|---------|-------------|-----|--------|
| Rails | 3000 | 4000 | +1000 |
| PostgreSQL | 5432 | 6432 | +1000 |
| Redis | 6379 | 7379 | +1000 |
| MinIO | 9000/9001 | 10000/10001 | +1000 |

### Management

```bash
# Rebuild after Dockerfile changes
bin/dev-e2e --build

# Stop E2E environment
docker compose -p e2e-tests down

# Full cleanup (including volumes)
docker compose -p e2e-tests down --volumes
```

**Features:**
- ✅ Single config file with environment variable port overrides
- ✅ Run dev and E2E simultaneously (no port conflicts)
- ✅ Independent data (Docker project isolation via `-p` flag)
- ✅ Fast iteration (Docker build cache)
- ✅ Consistent with CI/CD environment