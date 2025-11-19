# Secrets Management with SOPS

This project uses [SOPS (Secrets OPerationS)](https://github.com/getsops/sops) with [age encryption](https://github.com/FiloSottile/age) to manage secrets securely in version control.

## Overview

All secrets are stored encrypted in the repository under `config/secrets/` directory:
- `development.sops.yaml` - Development environment secrets
- `test.sops.yaml` - Test environment secrets
- `production.sops.yaml` - Production environment secrets

The secrets are automatically decrypted at Rails boot time via the SOPS loader initializer (`config/initializers/sops_credentials.rb`).

## Prerequisites

### Local Development

You need to install `age` and `sops`:

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

The project owner should provide you with the age private key. Save it to:

```bash
mkdir -p ~/.config/sops/age
# Paste the private key into this file:
nano ~/.config/sops/age/keys.txt
chmod 600 ~/.config/sops/age/keys.txt
```

**IMPORTANT**: Never commit your age private key to version control!

## Working with Secrets

### Viewing Secrets

To view decrypted secrets for an environment:

```bash
# Development
sops -d config/secrets/development.sops.yaml

# Production
sops -d config/secrets/production.sops.yaml

# Extract a specific value
sops -d --extract '["fontawesome"]["auth_token"]' config/secrets/development.sops.yaml
```

### Editing Secrets

To edit secrets in your preferred editor:

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

**Note**: Changes are automatically committed as encrypted YAML.

### Adding New Secrets

1. Edit the appropriate environment file:
   ```bash
   sops config/secrets/development.sops.yaml
   ```

2. Add your secret under the appropriate section:
   ```yaml
   new_service:
     api_key: your_secret_key_here
   ```

3. Update the Rails initializer if you need a helper method:
   ```ruby
   # config/initializers/sops_credentials.rb
   def new_service_api_key
     dig("new_service", "api_key")
   end
   ```

4. Access in your application:
   ```ruby
   Rails.application.config.sops.dig("new_service", "api_key")
   # or using credentials helper
   Rails.application.config.sops.credentials[:new_service][:api_key]
   ```

### Secret Structure

Secrets are organized in a hierarchical YAML structure:

```yaml
# Rails master key
rails:
  master_key: xxx

# FontAwesome Pro token
fontawesome:
  auth_token: xxx

# MinIO credentials
minio:
  access_key: xxx
  secret_key: xxx

# Application credentials (from old Rails credentials)
credentials:
  mailtrap:
    username: xxx
    password: xxx
  formula_eval:
    jwt_secret_key: xxx
  recaptcha:
    site_key: xxx
    secret_key: xxx
```

## CI/CD Configuration

### GitHub Actions

The following GitHub secret must be configured:

**`SOPS_AGE_KEY`** - The age private key for decrypting secrets in CI/CD

To add it:
1. Get the age private key from your password manager or `~/.config/sops/age/keys.txt`
2. Go to GitHub → Settings → Secrets and variables → Actions
3. Add new repository secret named `SOPS_AGE_KEY`
4. Paste the entire private key (including the header and footer lines)

The workflows will:
1. Install age and sops
2. Create the age key file from the secret
3. Decrypt secrets as needed for builds and tests

## Key Rotation

To rotate the age encryption key:

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

## Troubleshooting

### "Failed to decrypt" error

**Problem**: `Failed to get the data key required to decrypt the SOPS file.`

**Solution**: Ensure your age private key is correctly placed:
```bash
ls -la ~/.config/sops/age/keys.txt
# Should show: -rw------- (600 permissions)
```

### "No age key found" error

**Problem**: Rails can't find the age key at boot.

**Solution**:
```bash
# Verify age key exists
cat ~/.config/sops/age/keys.txt

# Verify SOPS can decrypt
sops -d config/secrets/development.sops.yaml
```

### Secrets not loading in Rails

**Problem**: Application boots but secrets are nil.

**Solution**: Check the Rails initializer loaded correctly:
```bash
# Start rails console
bin/rails c

# Check if SOPS is loaded
Rails.application.config.sops
# Should return the SopsCredentials module

# Check secrets are loaded
Rails.application.config.sops.secrets
# Should return a hash of your secrets
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

1. **Never commit unencrypted secrets** - All secrets must be SOPS-encrypted
2. **Protect your age private key** - Store in a password manager
3. **Rotate keys periodically** - At least once per year
4. **Use different keys per environment** - Consider separate keys for prod vs dev
5. **Audit secret access** - Review who has access to age keys
6. **Remove secrets from git history** - Use git-filter-repo if secrets were leaked

## Migration from git-crypt

This project was migrated from git-crypt to SOPS. Old encrypted files:
- `config/credentials/*.key` - Now in SOPS under `rails.master_key`
- `dockerfiles/fontawesome-auth.secret` - Now in SOPS under `fontawesome.auth_token`

These files are now gitignored and should not be committed.

## Additional Resources

- [SOPS Documentation](https://github.com/getsops/sops)
- [age Documentation](https://github.com/FiloSottile/age)
- [SOPS with age Tutorial](https://devops.datenkollektiv.de/using-sops-with-age-and-git-like-a-pro.html)
