# SOPS Secrets Directory

This directory contains SOPS-encrypted infrastructure keys. Application secrets are in Rails encrypted credentials (`config/credentials/*.yml.enc`).

## Files

- **`development.sops.yaml`** - Development infra keys (encrypted, safe to commit)
- **`test.sops.yaml`** - Test infra keys (encrypted, safe to commit)
- **`e2e.sops.yaml`** - E2E infra keys (encrypted, safe to commit)
- **`production.sops.yaml`** - Production infra keys (encrypted, safe to commit)

## What's stored here

Only infrastructure keys that are needed by scripts, CI, and Docker builds:

- `rails.master_key` -- Rails credential encryption key (extracted into `config/credentials/*.key`)
- `fontawesome.auth_token` -- FontAwesome Pro npm/bundler auth token
- `minio.access_key` / `minio.secret_key` -- MinIO S3 credentials for docker-compose

## Quick Commands

```bash
# View secrets
sops -d development.sops.yaml

# Edit secrets
sops development.sops.yaml

# Extract specific value
sops -d --extract '["fontawesome"]["auth_token"]' development.sops.yaml

# Extract Rails master key
sops -d --extract '["rails"]["master_key"]' development.sops.yaml
```
