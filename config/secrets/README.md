# SOPS Secrets Directory

This directory contains SOPS-encrypted infrastructure keys. Application secrets are in Rails encrypted credentials (`config/credentials/*.yml.enc`).

## Files

- **`build.sops.yaml`** - Build-time FontAwesome token only (encrypted, safe to commit)
- **`development.sops.yaml`** - Development infra keys (encrypted, safe to commit)
- **`test.sops.yaml`** - Test infra keys (encrypted, safe to commit)
- **`e2e.sops.yaml`** - E2E infra keys (encrypted, safe to commit)
- **`production.sops.yaml`** - Production infra keys (encrypted, safe to commit)

## Encryption keys (recipients)

Recipients are defined per-file in `.sops.yaml` (first-match rules):

- **admin** (`age193z7…`) — owner recovery key, held privately, never in CI. Recipient on every file.
- **build/CI** (`age18p3re8…`) — GitHub Actions `SOPS_AGE_KEY` + `dockerfiles/sops-age-key.secret`. Recipient on every file (trusted push/PR/build runs).
- **dependabot** (`age1et3r…`) — Dependabot `SOPS_AGE_KEY` only. Recipient on **`build`, `test`, `e2e` only** — deliberately NOT on `production`/`development`, so a Dependabot job (running untrusted updated dependency code) can never decrypt production secrets, in any commit. Do not add it there.

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
