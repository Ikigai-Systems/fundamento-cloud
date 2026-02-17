# Secrets Management

This project uses two systems for managing secrets:

1. **Rails encrypted credentials** -- Application secrets used by the running Rails app
2. **SOPS with age encryption** -- Infrastructure keys used by scripts, CI, and Docker builds

## Overview

### Rails Encrypted Credentials (Application Secrets)

Application secrets are stored in standard Rails encrypted credentials, per-environment:

- `config/credentials/development.yml.enc` -- Development app secrets
- `config/credentials/test.yml.enc` -- Test app secrets
- `config/credentials/production.yml.enc` -- Production app secrets

Each `.yml.enc` file is encrypted with the corresponding `.key` file (e.g., `config/credentials/development.key`). The key files are gitignored and extracted from SOPS by `bin/setup` and CI workflows.

### SOPS (Infrastructure Keys)

Infrastructure keys are stored encrypted in `config/secrets/`:

- `development.sops.yaml` -- Development infra keys
- `test.sops.yaml` -- Test infra keys
- `e2e.sops.yaml` -- E2E infra keys
- `production.sops.yaml` -- Production infra keys

These contain only:
- `rails.master_key` -- Rails credential encryption key (extracted into `config/credentials/*.key`)
- `fontawesome.auth_token` -- FontAwesome Pro npm/bundler auth token
- `minio.access_key` / `minio.secret_key` -- MinIO S3 credentials for docker-compose

The running Rails app does **not** use SOPS directly. SOPS keys are extracted by `bin/setup`, CI workflows, and Docker builds.

## Prerequisites

### Local Development

You need to install `age` and `sops` (for infrastructure keys):

```bash
# macOS
brew install age sops

# Linux (Ubuntu/Debian)
sudo apt-get install age
wget https://github.com/getsops/sops/releases/download/v3.9.3/sops-v3.9.3.linux.amd64
sudo mv sops-v3.9.3.linux.amd64 /usr/local/bin/sops
sudo chmod +x /usr/local/bin/sops

# Fedora/RHEL
sudo dnf install age sops
```

### Age Key Setup

The project owner should provide you with the age private key. Save it to the platform-specific location:

**macOS:**
```bash
mkdir -p ~/Library/Application\ Support/sops/age
# Paste the private key into this file:
nano ~/Library/Application\ Support/sops/age/keys.txt
chmod 600 ~/Library/Application\ Support/sops/age/keys.txt
```

**Linux:**
```bash
mkdir -p ~/.config/sops/age
# Paste the private key into this file:
nano ~/.config/sops/age/keys.txt
chmod 600 ~/.config/sops/age/keys.txt
```

**IMPORTANT**: Never commit your age private key to version control!

## Working with Rails Credentials (Application Secrets)

### Editing Credentials

Use the standard Rails credentials commands:

```bash
# Edit development credentials
rails credentials:edit --environment development

# Edit test credentials
rails credentials:edit --environment test

# Edit production credentials
rails credentials:edit --environment production
```

This opens the decrypted YAML in your `$EDITOR`. Save and exit to re-encrypt.

### Accessing Credentials in Code

```ruby
# Standard Rails credentials (per-environment)
Rails.application.credentials.dig(:mailtrap, :username)
Rails.application.credentials.dig(:sentry, :frontend_dsn)
Rails.application.credentials.recaptcha[:site_key]
```

### Adding New Application Secrets

1. Edit the credentials for the appropriate environment:
   ```bash
   rails credentials:edit --environment development
   ```

2. Add your secret:
   ```yaml
   new_service:
     api_key: your_secret_key_here
   ```

3. Access in your application:
   ```ruby
   Rails.application.credentials.dig(:new_service, :api_key)
   ```

4. Repeat for other environments (test, production) as needed.

### Credential Structure

Application credentials follow this structure:

```yaml
mailtrap:
  username: xxx
  password: xxx
formula_eval:
  jwt_secret_key: xxx
recaptcha:
  site_key: xxx
  secret_key: xxx
sentry:
  frontend_dsn: xxx
  backend_dsn: xxx
```

## Working with SOPS (Infrastructure Keys)

### Viewing SOPS Secrets

```bash
# Development
sops -d config/secrets/development.sops.yaml

# Production
sops -d config/secrets/production.sops.yaml

# Extract a specific value
sops -d --extract '["fontawesome"]["auth_token"]' config/secrets/development.sops.yaml
```

### Editing SOPS Secrets

```bash
# Development
sops config/secrets/development.sops.yaml

# Production
sops config/secrets/production.sops.yaml
```

SOPS will:
1. Decrypt the file
2. Open it in your `$EDITOR` (default: vim)
3. Re-encrypt it when you save and exit

### Adding New Infrastructure Keys

Only add keys to SOPS if they are needed by scripts, CI, or Docker builds (not the running Rails app). For application secrets, use Rails credentials instead.

1. Edit the appropriate SOPS file:
   ```bash
   sops config/secrets/development.sops.yaml
   ```

2. Add your key:
   ```yaml
   new_infra_service:
     api_key: your_key_here
   ```

3. Update `bin/setup` or CI workflows to extract the key where needed.

### SOPS Secret Structure

Infrastructure keys follow this structure:

```yaml
# Rails master key (extracted into config/credentials/*.key)
rails:
  master_key: xxx

# FontAwesome Pro token
fontawesome:
  auth_token: xxx

# MinIO credentials
minio:
  access_key: xxx
  secret_key: xxx
```

## CI/CD Configuration

### GitHub Actions

The following GitHub secret must be configured:

**`SOPS_AGE_KEY`** -- The age private key for decrypting infrastructure keys in CI/CD

To add it:
1. Get the age private key from your password manager or `~/.config/sops/age/keys.txt`
2. Go to GitHub -> Settings -> Secrets and variables -> Actions
3. Add new repository secret named `SOPS_AGE_KEY`
4. Paste the entire private key (including the header and footer lines)

The workflows will:
1. Install age and sops
2. Create the age key file from the secret
3. Extract Rails master keys from SOPS into `config/credentials/*.key`
4. Extract FontAwesome token for bundler/npm auth
5. Rails then boots normally using standard encrypted credentials

## Key Rotation

### Rotating the Age Key (SOPS)

1. Generate a new age key:
   ```bash
   age-keygen -o ~/.config/sops/age/keys-new.txt
   ```

2. Note the new public key from the output

3. Update `.sops.yaml` with the new public key (keep the old one temporarily)

4. Re-encrypt all secrets with both keys:
   ```bash
   sops updatekeys config/secrets/development.sops.yaml
   sops updatekeys config/secrets/test.sops.yaml
   sops updatekeys config/secrets/production.sops.yaml
   ```

5. Distribute the new private key to team members and update CI/CD secrets

6. After confirming everyone can decrypt, remove the old key from `.sops.yaml`

7. Re-encrypt files again to remove the old key:
   ```bash
   sops updatekeys config/secrets/*.sops.yaml
   ```

### Rotating Rails Master Keys

1. Generate a new master key and re-encrypt credentials:
   ```bash
   rails credentials:edit --environment <env>
   ```

2. Update the master key in the corresponding SOPS file:
   ```bash
   sops config/secrets/<env>.sops.yaml
   # Update rails.master_key with the new key from config/credentials/<env>.key
   ```

## Troubleshooting

### "Failed to decrypt" SOPS error

**Problem**: `Failed to get the data key required to decrypt the SOPS file.`

**Solution**: Ensure your age private key is correctly placed:
```bash
ls -la ~/.config/sops/age/keys.txt
# Should show: -rw------- (600 permissions)
```

### "No age key found" error

**Problem**: Cannot decrypt SOPS files.

**Solution**:
```bash
# Verify age key exists
cat ~/.config/sops/age/keys.txt

# Verify SOPS can decrypt
sops -d config/secrets/development.sops.yaml
```

### Credentials not loading in Rails

**Problem**: Application boots but credentials are nil.

**Solution**: Check that the master key file exists:
```bash
# Verify master key exists for the environment
ls -la config/credentials/development.key

# If missing, extract from SOPS
sops -d --extract '["rails"]["master_key"]' config/secrets/development.sops.yaml > config/credentials/development.key

# Or run bin/setup which does this automatically
bin/setup

# Test in Rails console
rails console
Rails.application.credentials.dig(:mailtrap, :username)
```

### CI/CD failures

**Problem**: GitHub Actions failing with SOPS errors.

**Solution**:
1. Verify `SOPS_AGE_KEY` secret is set in GitHub
2. Check the secret contains the full key including header/footer:
   ```
   # AGE-SECRET-KEY-1...
   AGE-SECRET-KEY-1XXXXX...
   ```
3. Review workflow logs for specific error messages

## Security Best Practices

1. **Never commit unencrypted secrets** -- All secrets must be encrypted (SOPS or Rails credentials)
2. **Protect your age private key** -- Store in a password manager
3. **Protect Rails master keys** -- Never commit `config/credentials/*.key` files
4. **Rotate keys periodically** -- At least once per year
5. **Audit secret access** -- Review who has access to age keys and master keys
6. **Remove secrets from git history** -- Use git-filter-repo if secrets were leaked

## Additional Resources

- [Rails Encrypted Credentials Guide](https://guides.rubyonrails.org/security.html#custom-credentials)
- [SOPS Documentation](https://github.com/getsops/sops)
- [age Documentation](https://github.com/FiloSottile/age)
- [SOPS with age Tutorial](https://devops.datenkollektiv.de/using-sops-with-age-and-git-like-a-pro.html)
