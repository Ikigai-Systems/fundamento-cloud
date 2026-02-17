# Design: Remove SopsCredentials, Revert to Rails Credentials

**Date:** 2026-02-16
**Status:** Approved

## Problem

The custom `SopsCredentials` system that overrides `Rails.application.credentials` causes too many problems. We want to revert to standard Rails per-environment encrypted credentials and limit SOPS to infrastructure key management only (replacing git-crypt).

## Architecture After Migration

```
SOPS (config/secrets/*.sops.yaml) — app repo
  └── Infra keys only: rails master keys, fontawesome token, minio keys
  └── Used by: bin/setup, CI/CD, Docker build — NOT by the running Rails app

SOPS (app-secrets.yaml) — infra repo, decrypted by FluxCD (AWS KMS)
  └── Kubernetes secrets: DATABASE_URL, REDIS_URL, SECRET_KEY_BASE, RAILS_MASTER_KEY
  └── No more SOPS_AGE_KEY passed to containers

Rails credentials (config/credentials/*.yml.enc) — app repo
  └── All application secrets: sentry, mailtrap, recaptcha, posthog, livechat, etc.
  └── Decrypted by Rails at boot using RAILS_MASTER_KEY env var
```

## Changes in fundamento-cloud (app repo)

### Deleted

- `config/sops_credentials.rb` — entire SopsCredentials module
- `MIGRATION_SUMMARY.md` — obsolete migration doc

### Modified — config/application.rb

- Remove `require_relative "sops_credentials"` and `SopsCredentials.load!`
- Remove `sops` method and `credentials` override
- Rails credentials work normally again

### Modified — app/services/pandoc_converter_service.rb

- `Rails.application.sops.credentials.dig(...)` → `Rails.application.credentials.dig(...)`

### Modified — Dockerfile

- Build stage: keep SOPS + age (needed to extract fontawesome token + master key for asset precompilation)
- Final stage: remove SOPS + age installation entirely (no longer needed at runtime)

### Modified — docker-compose.yml

- Replace `SOPS_AGE_KEY` with `RAILS_MASTER_KEY` in the `x-rails-environment` anchor
- Remove the `sops-age-key` Docker secret definition and references

### Modified — CI workflows

- `push-to-github-packages.yaml`: pass `RAILS_MASTER_KEY` as BuildKit secret for asset precompilation
- `run-tests.yaml` and `run-e2e-tests.yaml`: extract master key from SOPS and set `RAILS_MASTER_KEY`

### Modified — SOPS secret files

- Remove the `credentials:` section from all `*.sops.yaml` files
- Keep only: `rails.master_key` (per-env), `fontawesome.auth_token`, `minio.*`

### New — Rails credential files

- `config/credentials/development.yml.enc` + `config/credentials/development.key`
- `config/credentials/test.yml.enc` + `config/credentials/test.key`
- `config/credentials/production.yml.enc` + `config/credentials/production.key`
- `.key` files are gitignored; values come from SOPS `rails.master_key`

### Modified — .gitattributes

- Restore `config/credentials/*.yml.enc diff=rails_credentials`
- Restore `config/credentials.yml.enc diff=rails_credentials`
- Do NOT restore git-crypt filters (SOPS replaces git-crypt)

### Modified — bin/setup

- Extract per-env master keys from SOPS into `config/credentials/*.key` files

### Modified — docs

- CLAUDE.md, README.md, SECRETS.md updated to reflect the new approach

## Changes in fundamento-infra (infra repo)

### Modified — kubernetes/apps/prod/fundamento-cloud/app-secrets.yaml (SOPS-encrypted)

- Remove `SOPS_AGE_KEY`
- Add `RAILS_MASTER_KEY` (value = production master key)

### Modified — kubernetes/apps/base/fundamento-cloud/website/deployment.yaml

- Replace `SOPS_AGE_KEY` env var with `RAILS_MASTER_KEY` from `app-secrets`

### Modified — kubernetes/apps/base/fundamento-cloud/jobs/deployment.yaml

- Replace `SOPS_AGE_KEY` env var with `RAILS_MASTER_KEY` from `app-secrets`

### Modified — kubernetes/apps/prod/fundamento-cloud/app-secrets.example.yaml

- Update to show `RAILS_MASTER_KEY` instead of `SOPS_AGE_KEY`

### Unchanged

- FluxCD SOPS decryption (`decryption.provider: sops` with AWS KMS) — infra-level SOPS for K8s secrets in Git, independent from the app-level SOPS we're removing

## Deployment Coordination

Deploy infra changes first (so `RAILS_MASTER_KEY` env var is available in the cluster), then deploy the app that expects it. The old app version ignores `RAILS_MASTER_KEY` so there's no conflict during the transition.
