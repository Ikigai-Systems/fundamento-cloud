# SOPS Secrets Directory

This directory contains encrypted secrets for all environments.

## Files

- **`development.sops.yaml`** - Development environment secrets (encrypted, safe to commit)
- **`test.sops.yaml`** - Test environment secrets (encrypted, safe to commit)
- **`production.sops.yaml`** - Production environment secrets (encrypted, safe to commit)
- **`ci-age-key.txt`** - CI/CD age private key (gitignored, DO NOT COMMIT)

## Age Keys

This project uses **two separate age keys**:

### 1. Local Development Key
- **Your personal key** for local development
- Location: `~/.config/sops/age/keys.txt`
- Public key: `age193z7fgdkklf8f290ye6zj8ee07g6rudls8hhpfqsj6c6tms2fshsxk9lfk`

### 2. CI/CD Key
- **Dedicated key** for GitHub Actions
- Location: `config/secrets/ci-age-key.txt` (this directory)
- Public key: `age18p3re8vk23zc4sepnl6f83ljl4zglgxzacuzn9meg4egfhwmmp9scn5d3s`
- **Use this key for GitHub Secrets** (`SOPS_AGE_KEY`)

## Quick Commands

```bash
# View secrets (uses your local key automatically)
sops -d development.sops.yaml

# Edit secrets
sops development.sops.yaml

# Extract specific value
sops -d --extract '["fontawesome"]["auth_token"]' development.sops.yaml

# Test CI key (for verification)
SOPS_AGE_KEY_FILE=ci-age-key.txt sops -d development.sops.yaml
```

## GitHub Actions Setup

Add the CI key to GitHub Secrets:

```bash
# Copy the CI key
cat config/secrets/ci-age-key.txt

# Then add to GitHub:
# Settings → Secrets and variables → Actions → New secret
# Name: SOPS_AGE_KEY
# Value: <paste entire key including header>
```

## Security Notes

- ✅ `.sops.yaml` files are encrypted and safe to commit
- ❌ `ci-age-key.txt` is gitignored and should NEVER be committed
- ✅ Both keys can decrypt all secrets
- ✅ Keys can be rotated independently

## Need Help?

See the main [SECRETS.md](../../SECRETS.md) for complete documentation.
