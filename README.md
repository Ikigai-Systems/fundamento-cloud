# Fundamento Cloud

## Secrets Management

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

## Development Commands

### Running locally

```
bin/dev
```

This runs the full development stack including docker services like PostgreSQL and Redis..

It should spawn following processes:
* rails app listening on port `3000`
* vite devserver listening on port `3036`
* rails background job processor (Good Job)
* formula evaluation micro-service listening on port `3001`

Access application via `http://localhost:3000`

### Running Tests
```bash
# RSpec unit tests
bundle exec rspec

# Run specific test file
bundle exec rspec spec/models/space_spec.rb

# Go the the next failed test
bundle exec rspec --next
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

## Production mode

1. `rails db:prepare RAILS_ENV=production` -> once, to setup database schema
2. (re)build frontend: `npm run build` -> this will (re)populate `public` folder
3. `foreman start -f Procfile.prod`  
   This will run rails server on port `3000`

## Docker Development

Infrastucture services are managed by docker compose locally and on CI/CD. Also the app is distributed as docker images and those get deployed automatically to Kubernetes cluster.


```bash
# Run with environment variables
SECRET_KEY_BASE=abcdef docker-compose up

# Run only infrastructure services
docker compose up redis postgresql
```

### Running only selected services

```
docker compose up redis postgresql
```

Running the same docker compose again with different name: 
```
docker compose -p e2e-tests up
```

## E2E testing (Simultaneous with Development)

E2E tests use the same `docker-compose.yml` but with environment variables to offset ports (+1000) and the `-p e2e-tests` flag for container/volume isolation.

### Running Both Environments Simultaneously

You can run both development and E2E environments simultaneously as they don't conflict with each other on ports, database, etc.

```bash
# Terminal 1: Start local development (normal ports)
bin/dev

# Terminal 2: Rebuild and start E2E environment (tears down old containers automatically)
bin/dev-e2e
```

The easiest way to rebuild and run E2E tests in one command:

```bash
bin/dev-e2e up --test
```

### E2E Commands

`bin/dev-e2e` is a self-contained CLI for managing the E2E environment:

```bash
# Rebuild and start (default - tears down, rebuilds, starts fresh)
bin/dev-e2e

# Start without rebuilding (faster, uses existing images)
bin/dev-e2e up --no-build

# Rebuild, start, and run Cypress tests
bin/dev-e2e up --test

# Run Cypress tests (environment must be running)
bin/dev-e2e test

# Stream logs from all containers
bin/dev-e2e logs

# Open Rails console in the website container
bin/dev-e2e console

# Open bash shell in the website container
bin/dev-e2e shell

# Stop E2E containers
bin/dev-e2e down

# Full cleanup (containers, volumes, and local images)
bin/dev-e2e clean
```

### E2E Port Mapping

| Service | Development | E2E Tests | Offset |
|---------|-------------|-----------|--------|
| Rails Website | 3000 | 4000 | +1000 |
| Vite Dev Server | 3036 | 3037 | test env |
| BlockNote Converter | 3002 | 4002 | +1000 |
| PostgreSQL | 5432 | 6432 | +1000 |
| Redis | 6379 | 7379 | +1000 |
| MinIO API | 9000 | 10000 | +1000 |
| MinIO Console | 9001 | 10001 | +1000 |
