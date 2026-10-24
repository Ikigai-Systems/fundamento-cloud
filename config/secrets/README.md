# SOPS Secrets Directory

This directory contains SOPS-encrypted infrastructure keys. Application secrets are in Rails encrypted credentials (`config/credentials/*.yml.enc`).

## Files

- **`development.sops.yaml`** - Development infra keys (encrypted, safe to commit)
- **`test.sops.yaml`** - Test infra keys (encrypted, safe to commit)
- **`e2e.sops.yaml`** - E2E infra keys (encrypted, safe to commit)
- **`production.sops.yaml`** - Production infra keys (encrypted, safe to commit)

## Encryption keys (recipients)

Recipients are defined per-file in `.sops.yaml` (first-match rules):

- **admin** (`age193z7…`) — owner recovery key, held privately, never in CI. Recipient on every file, and the only one on `production`.
- **build** (`age1m2ksw2…`) — GitHub Actions `SOPS_AGE_KEY` + `dockerfiles/sops-age-key.secret` (from 1Password via `bin/setup`). Recipient on `test`, `e2e` and `development`. Not on `production`: nothing in CI or the Docker build reads it.
- **dependabot** (`age1et3r…`) — Dependabot `SOPS_AGE_KEY` only. Recipient on **`test` and `e2e` only** — deliberately NOT on `production`/`development`, so a Dependabot job (running untrusted updated dependency code) can never decrypt production secrets, in any commit. Do not add it there.

## What's stored here

Only infrastructure keys that are needed by scripts, CI, and Docker builds:

- `rails.master_key` -- Rails credential encryption key (extracted into `config/credentials/*.key`)
- `minio.access_key` / `minio.secret_key` -- MinIO S3 credentials for docker-compose

## Quick Commands

```bash
# View secrets
sops -d development.sops.yaml

# Edit secrets
sops development.sops.yaml

# Extract specific value
sops -d --extract '["rails"]["master_key"]' development.sops.yaml
```
