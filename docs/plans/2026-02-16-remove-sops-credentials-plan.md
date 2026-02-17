# Remove SopsCredentials, Revert to Rails Credentials — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the custom SopsCredentials system entirely and revert to standard Rails per-environment encrypted credentials. SOPS remains only for infrastructure keys (fontawesome token, minio keys, Rails master keys).

**Architecture:** SOPS files keep only infra keys extracted by scripts/CI. Rails credentials files (`config/credentials/*.yml.enc`) hold all application secrets. The running Rails app has zero knowledge of SOPS — it uses standard `Rails.application.credentials` backed by `RAILS_MASTER_KEY` env var.

**Tech Stack:** Rails 8.1 encrypted credentials, SOPS with age (infra keys only), Docker BuildKit secrets, Kubernetes Secrets (FluxCD SOPS-encrypted).

**Repos:** `fundamento-cloud` (app) and `fundamento-infra` (infrastructure — at `../fundamento-infra`).

---

### Task 1: Extract master keys from SOPS and create Rails credential files

This is the foundational step. We extract the current `rails.master_key` values from SOPS for each environment and use them as the Rails credential encryption keys. Then we create the encrypted credential files with all the application secrets currently in the `credentials:` section of each SOPS file.

**Files:**
- Create: `config/credentials/development.yml.enc`
- Create: `config/credentials/development.key`
- Create: `config/credentials/test.yml.enc`
- Create: `config/credentials/test.key`
- Create: `config/credentials/production.yml.enc`
- Create: `config/credentials/production.key`
- Create: `config/credentials/e2e.yml.enc`
- Create: `config/credentials/e2e.key`

**Step 1: Extract master keys from SOPS into .key files**

For each environment, extract the `rails.master_key` value and write it to the corresponding `.key` file:

```bash
sops -d --extract '["rails"]["master_key"]' config/secrets/development.sops.yaml > config/credentials/development.key
sops -d --extract '["rails"]["master_key"]' config/secrets/test.sops.yaml > config/credentials/test.key
sops -d --extract '["rails"]["master_key"]' config/secrets/production.sops.yaml > config/credentials/production.key
sops -d --extract '["rails"]["master_key"]' config/secrets/e2e.sops.yaml > config/credentials/e2e.key
chmod 600 config/credentials/*.key
```

**Step 2: View the current credentials from SOPS to know what to put in Rails credentials**

```bash
sops -d config/secrets/development.sops.yaml
sops -d config/secrets/test.sops.yaml
sops -d config/secrets/production.sops.yaml
sops -d config/secrets/e2e.sops.yaml
```

Look at the `credentials:` section of each file. These values must be copied into the corresponding Rails credential file.

**Step 3: Create the encrypted credential files**

For each environment, run the Rails credentials editor. This will use the `.key` file automatically:

```bash
EDITOR="code --wait" rails credentials:edit --environment development
EDITOR="code --wait" rails credentials:edit --environment test
EDITOR="code --wait" rails credentials:edit --environment production
EDITOR="code --wait" rails credentials:edit --environment e2e
```

In each editor, paste the YAML content from the `credentials:` section of the corresponding SOPS file. For example, development might look like:

```yaml
secret_key_base: <value from SOPS credentials.secret_key_base if present>
sentry_dsn: <value>
sentry:
  frontend_dsn: <value>
  pandoc_converter_dsn: <value>
  blocknote_converter_dsn: <value>
mailtrap:
  username: <value>
  password: <value>
active_record_encryption:
  primary_key: <value>
  deterministic_key: <value>
  key_derivation_salt: <value>
formula_eval:
  jwt_secret_key: <value>
recaptcha:
  site_key: <value>
  secret_key: <value>
livechat:
  tawk_site_id: <value>
  tawk_api_key: <value>
posthog:
  api_key: <value>
```

The exact keys differ per environment — test/e2e have fewer secrets. Copy exactly what's under `credentials:` in each SOPS file.

**Step 4: Verify credentials are readable**

```bash
RAILS_ENV=development rails credentials:show --environment development
RAILS_ENV=test rails credentials:show --environment test
RAILS_ENV=production rails credentials:show --environment production
RAILS_ENV=e2e rails credentials:show --environment e2e
```

Expected: each command prints the decrypted YAML matching what was entered.

**Step 6: Commit**

```bash
git add config/credentials/*.yml.enc
git commit -m "feat: create Rails encrypted credential files for all environments

Extract application secrets from SOPS credentials sections into standard
Rails per-environment encrypted credential files."
```

Note: `.key` files are already gitignored at `.gitignore:56` (`config/credentials/*.key`).

---

### Task 2: Fix application code referencing SOPS

**Files:**
- Modify: `app/services/pandoc_converter_service.rb:16`

**Step 1: Update the SOPS credentials reference**

Change line 16 from:

```ruby
    sentry_dsn = Rails.application.sops.credentials.dig(:sentry, :pandoc_converter_dsn)
```

to:

```ruby
    sentry_dsn = Rails.application.credentials.dig(:sentry, :pandoc_converter_dsn)
```

**Step 2: Search for any other SOPS references in Ruby code**

```bash
grep -r "Rails.application.sops" --include="*.rb" app/ config/ lib/
```

Expected: no results.

**Step 3: Verify the app still boots and the service works**

```bash
rails runner "puts PandocConverterService.build_env"
```

Expected: prints a hash (possibly empty if no sentry DSN configured in development).

**Step 4: Commit**

```bash
git add app/services/pandoc_converter_service.rb
git commit -m "fix: use Rails.application.credentials instead of sops in PandocConverterService"
```

---

### Task 3: Remove SopsCredentials and clean up application.rb

**Files:**
- Delete: `config/sops_credentials.rb`
- Modify: `config/application.rb:9-14,21-30`

**Step 1: Delete the SopsCredentials implementation**

```bash
git rm config/sops_credentials.rb
```

**Step 2: Clean up config/application.rb**

Remove lines 9-14 (SOPS loading) and lines 21-30 (sops method + credentials override). The file should become:

```ruby
require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Fundamento
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.1

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w(assets tasks))

    # From https://guides.rubyonrails.org/active_job_basics.html#serializers
    config.autoload_once_paths << "#{Rails.root}/app/serializers"

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    config.action_mailer.default_url_options = { :host => ENV.fetch("HTTP_HOST", "localhost:3000") }

    # Enable lograge, but make it the default only on production
    config.lograge.enabled = true
    config.lograge.formatter = Lograge::Formatters::Logstash.new

    if !Rails.env.production? && !Rails.env.standalone?
      config.lograge.keep_original_rails_log = true
      config.lograge.logger = ActiveSupport::Logger.new "#{Rails.root}/log/#{Rails.env}-lograge.log"
    end

    # Only loads a smaller set of middleware suitable for API only apps.
    # Middleware like session, flash, cookies can be added back manually.
    # Skip views, helpers and assets when generating a new resource.
    config.api_only = false
  end
end
```

**Step 3: Verify Rails boots successfully**

```bash
RAILS_ENV=development rails runner "puts Rails.application.credentials.dig(:formula_eval, :jwt_secret_key)"
```

Expected: prints the jwt_secret_key value (not nil).

**Step 4: Run rspecs**

Run tests and make sure all are passing.

```bash
bin/rspec
```

**Step 5: Commit**

```bash
git add config/application.rb
git commit -m "feat: remove SopsCredentials module

Delete config/sops_credentials.rb and remove SOPS loading, sops method,
and credentials override from config/application.rb. Rails now uses
standard encrypted credentials."
```

---

### Task 4: Restore .gitattributes for Rails credentials

**Files:**
- Modify: `.gitattributes`

**Step 1: Add Rails credentials diff driver entries**

Append to `.gitattributes`:

```
config/credentials/*.yml.enc diff=rails_credentials
config/credentials.yml.enc diff=rails_credentials
```

The full file becomes:

```
# See https://git-scm.com/docs/gitattributes for more about git attribute files.

# Mark the database schema as having been generated.
db/schema.rb linguist-generated

# Mark any vendored files as having been vendored.
vendor/* linguist-vendored

config/credentials/*.yml.enc diff=rails_credentials
config/credentials.yml.enc diff=rails_credentials
```

**Step 2: Commit**

```bash
git add .gitattributes
git commit -m "fix: restore .gitattributes diff driver for Rails credential files"
```

---

### Task 5: Update Dockerfile — remove SOPS from final stage

**Files:**
- Modify: `Dockerfile:84-87,92-114`

**Step 1: Update build stage asset precompile**

The build stage currently mounts `sops-age-key` for asset precompilation (line 85). After removing SopsCredentials, Rails no longer calls `sops` at boot. Instead it needs `RAILS_MASTER_KEY`. But since we use `SECRET_KEY_BASE_DUMMY=1`, Rails skips credential loading entirely, so we can simply remove the SOPS mount.

Change lines 83-87 from:

```dockerfile
# Ikigai-specific: precompile assets
# Mount SOPS age key as secret and set it as environment variable for SOPS to use
RUN --mount=type=secret,id=sops-age-key,env=SOPS_AGE_KEY \
    SECRET_KEY_BASE_DUMMY=1 DATABASE_URL="postgres://postgres:password@localhost/postgres" bin/rails assets:precompile && \
    rm -rf tmp/cache/assets
```

to:

```dockerfile
# Precompile assets (SECRET_KEY_BASE_DUMMY=1 skips credential loading)
RUN SECRET_KEY_BASE_DUMMY=1 DATABASE_URL="postgres://postgres:password@localhost/postgres" bin/rails assets:precompile && \
    rm -rf tmp/cache/assets
```

**Step 2: Remove SOPS and age from final stage**

Remove lines 95-114 which declare `SOPS_VERSION` arg and install `age` and `sops` in the final image. The final stage install block should only install deployment packages:

Change:

```dockerfile
# Re-declare build args for this stage
ARG SOPS_VERSION=3.11.0
ARG NODE_MAJOR=24
ARG TARGETARCH

# Copy Node.js from node-source stage
COPY --from=node-source /usr/local/bin/node /usr/local/bin/node
COPY --from=node-source /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/bin/node /usr/local/bin/nodejs && \
    ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm && \
    ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

# Install packages needed for deployment (including age and sops for secrets management)
RUN --mount=target=/var/lib/apt/lists,type=cache,sharing=locked \
    --mount=target=/var/cache/apt,type=cache,sharing=locked \
    apt-get update -qq && \
    apt-get install --no-install-recommends -y libvips gettext age && \
    curl -LO https://github.com/getsops/sops/releases/download/v${SOPS_VERSION}/sops_${SOPS_VERSION}_${TARGETARCH}.deb && \
    dpkg -i sops_${SOPS_VERSION}_${TARGETARCH}.deb && \
    rm sops_${SOPS_VERSION}_${TARGETARCH}.deb
```

to:

```dockerfile
ARG NODE_MAJOR=24

# Copy Node.js from node-source stage
COPY --from=node-source /usr/local/bin/node /usr/local/bin/node
COPY --from=node-source /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/bin/node /usr/local/bin/nodejs && \
    ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm && \
    ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

# Install packages needed for deployment
RUN --mount=target=/var/lib/apt/lists,type=cache,sharing=locked \
    --mount=target=/var/cache/apt,type=cache,sharing=locked \
    apt-get update -qq && \
    apt-get install --no-install-recommends -y libvips gettext
```

Note: `curl` and `TARGETARCH` are no longer needed in the final stage. Keep `age` and `sops` in the build stage (still needed to extract fontawesome token in CI).

**Step 3: Also clean up the top-level SOPS_VERSION arg if only used in build stage**

The `ARG SOPS_VERSION=3.11.0` on line 5 is still needed for the build stage. Keep it.

**Step 4: Verify Docker build still works**

```bash
bin/docker-build-local production
```

Expected: builds successfully. The final image no longer contains `sops` or `age`.

**Step 5: Commit**

```bash
git add Dockerfile
git commit -m "feat: remove SOPS and age from production Docker image

SOPS is no longer needed at runtime. Keep it only in the build stage for
fontawesome token extraction. Remove sops-age-key mount from asset
precompile (SECRET_KEY_BASE_DUMMY=1 skips credential loading)."
```

---

### Task 6: Update docker-compose.yml

**Files:**
- Modify: `docker-compose.yml:11,73-77,97-101,124-128`

**Step 1: Replace SOPS_AGE_KEY with RAILS_MASTER_KEY in x-rails-environment**

Change line 11 from:

```yaml
  SOPS_AGE_KEY: ${SOPS_AGE_KEY}
```

to:

```yaml
  RAILS_MASTER_KEY: ${RAILS_MASTER_KEY}
```

**Step 2: Remove sops-age-key from website service build secrets and runtime secrets**

In the `website` service (lines 73-77), change:

```yaml
      secrets:
        - fontawesome-auth
        - sops-age-key
    secrets:
      - sops-age-key
```

to:

```yaml
      secrets:
        - fontawesome-auth
```

(Remove `- sops-age-key` from build secrets and remove the entire runtime `secrets:` block.)

**Step 3: Same for jobs service**

In the `jobs` service (lines 97-101), change:

```yaml
      secrets:
        - fontawesome-auth
        - sops-age-key
    secrets:
      - sops-age-key
```

to:

```yaml
      secrets:
        - fontawesome-auth
```

**Step 4: Remove sops-age-key from secrets definition**

Remove the `sops-age-key` entry from the bottom `secrets:` section (lines 127-128):

```yaml
secrets:
  fontawesome-auth:
    file: dockerfiles/fontawesome-auth.secret
```

**Step 5: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: replace SOPS_AGE_KEY with RAILS_MASTER_KEY in docker-compose

Containers no longer need SOPS at runtime. Pass RAILS_MASTER_KEY instead
for Rails credential decryption. Remove sops-age-key Docker secret."
```

---

### Task 7: Update bin/dev-e2e

**Files:**
- Modify: `bin/dev-e2e:104-138`

**Step 1: Replace load_sops_key! with load_rails_master_key!**

The method currently reads `dockerfiles/sops-age-key.secret` and sets `SOPS_AGE_KEY`. It needs to instead extract the master key from SOPS and set `RAILS_MASTER_KEY`.

Replace the `load_sops_key!` method (lines 104-138) with:

```ruby
  def load_rails_master_key!
    return if ENV["RAILS_MASTER_KEY"] && !ENV["RAILS_MASTER_KEY"].empty?

    # Extract the e2e master key from SOPS
    sops_file = File.join(Dir.pwd, "config", "secrets", "e2e.sops.yaml")

    unless File.exist?(sops_file)
      abort <<~MSG
        Error: SOPS secrets file not found: #{sops_file}

        Ensure config/secrets/e2e.sops.yaml exists and your age key is configured.
      MSG
    end

    puts "Extracting RAILS_MASTER_KEY from SOPS for e2e environment..."
    puts ""

    key = `sops -d --extract '["rails"]["master_key"]' #{sops_file} 2>/dev/null`.strip

    if $?.success? && !key.empty?
      ENV["RAILS_MASTER_KEY"] = key
    else
      abort <<~MSG
        Error: Failed to extract rails master key from #{sops_file}

        Ensure your age key is configured at ~/.config/sops/age/keys.txt
      MSG
    end
  end
```

**Step 2: Update the call site**

Change line 28 from `load_sops_key!` to `load_rails_master_key!`.

**Step 3: Commit**

```bash
git add bin/dev-e2e
git commit -m "feat: bin/dev-e2e extracts RAILS_MASTER_KEY from SOPS instead of passing SOPS_AGE_KEY"
```

---

### Task 8: Update bin/setup

**Files:**
- Modify: `bin/setup:15-17`

**Step 1: Add credential key extraction from SOPS**

After the existing SOPS secret extraction (line 17), add lines to extract master keys for all environments:

```ruby
  puts "== Getting secrets ready =="
  system!("op document get --account my.1password.com 57od4h7zivbd6pfr2yvapqttwm --out-file dockerfiles/sops-age-key.secret")
  system!("SOPS_AGE_KEY_FILE=dockerfiles/sops-age-key.secret sops -d --extract '[\"fontawesome\"][\"auth_token\"]' --output dockerfiles/fontawesome-auth.secret config/secrets/development.sops.yaml")

  puts "== Extracting Rails credential keys from SOPS =="
  FileUtils.mkdir_p("config/credentials")
  %w[development test e2e production].each do |env|
    sops_file = "config/secrets/#{env}.sops.yaml"
    key_file = "config/credentials/#{env}.key"
    next unless File.exist?(sops_file)

    system!("SOPS_AGE_KEY_FILE=dockerfiles/sops-age-key.secret sops -d --extract '[\"rails\"][\"master_key\"]' --output #{key_file} #{sops_file}")
    File.chmod(0600, key_file)
  end
```

**Step 2: Commit**

```bash
git add bin/setup
git commit -m "feat: bin/setup extracts Rails credential .key files from SOPS"
```

---

### Task 9: Update bin/docker-build-local

**Files:**
- Modify: `bin/docker-build-local`

**Step 1: Remove the sops-age-key secret from the Docker build command**

The script currently passes `--secret id=sops-age-key,...` to Docker build (line 54). Since the Dockerfile no longer mounts this secret during asset precompile, remove it.

Change lines 39-40 from:

```bash
# Copy SOPS age key to secret file
cat ~/.config/sops/age/keys.txt > dockerfiles/sops-age-key.secret
```

Remove these lines (no longer needed for the build).

Change the docker buildx command (lines 46-57) to remove the sops-age-key secret:

```bash
docker buildx build \
  --file Dockerfile \
  --target "${TARGET}" \
  --build-arg RAILS_ENV="${RAILS_ENV}" \
  --build-arg SOPS_VERSION=3.11.0 \
  --build-arg NODE_MAJOR=24 \
  --secret id=fontawesome-auth,src=dockerfiles/fontawesome-auth.secret \
  --tag "fundamento-cloud:${TARGET}" \
  --load \
  .
```

**Step 2: Update the run instructions at the bottom**

Change the run instructions to use `RAILS_MASTER_KEY` instead of `SOPS_AGE_KEY`:

```bash
echo "To run with docker-compose:"
echo "  export RAILS_MASTER_KEY=\$(sops -d --extract '[\"rails\"][\"master_key\"]' config/secrets/${RAILS_ENV}.sops.yaml)"
echo "  docker-compose up"
echo ""
echo "Or run standalone:"
echo "  docker run -p 3000:3000 -e RAILS_MASTER_KEY=\"\$(sops -d --extract '[\"rails\"][\"master_key\"]' config/secrets/${RAILS_ENV}.sops.yaml)\" fundamento-cloud:${TARGET}"
```

**Step 3: Commit**

```bash
git add bin/docker-build-local
git commit -m "feat: bin/docker-build-local no longer passes SOPS age key to Docker build"
```

---

### Task 10: Update CI workflow — run-tests.yaml

**Files:**
- Modify: `.github/workflows/run-tests.yaml:40-43`

**Step 1: Extract RAILS_MASTER_KEY in addition to FontAwesome token**

Change the "Decrypt and export secrets" step (lines 40-43) to also extract the master key:

```yaml
      - name: Decrypt and export secrets
        run: |
          # Extract FontAwesome token and set as environment variable
          echo "BUNDLE_DL__FONTAWESOME__COM=$(sops -d --extract '["fontawesome"]["auth_token"]' config/secrets/test.sops.yaml)" >> $GITHUB_ENV

          # Extract Rails master key for credential decryption
          echo "RAILS_MASTER_KEY=$(sops -d --extract '["rails"]["master_key"]' config/secrets/test.sops.yaml)" >> $GITHUB_ENV
```

**Step 2: Commit**

```bash
git add .github/workflows/run-tests.yaml
git commit -m "ci: extract RAILS_MASTER_KEY from SOPS in test workflow"
```

---

### Task 11: Update CI workflow — push-to-github-packages.yaml

**Files:**
- Modify: `.github/workflows/push-to-github-packages.yaml:58-68,118-125`

**Step 1: Remove SOPS age key file creation from the decrypt step**

Change the "Decrypt secrets for Docker build" step to remove the SOPS age key file:

```yaml
      - name: Decrypt secrets for Docker build
        if: matrix.needs-secrets
        run: |
          # Extract FontAwesome token for Docker BuildKit secret
          sops -d --extract '["fontawesome"]["auth_token"]' config/secrets/production.sops.yaml > /tmp/fontawesome-auth.secret
          echo "FONTAWESOME_SECRET_FILE=/tmp/fontawesome-auth.secret" >> $GITHUB_ENV
```

(Remove lines 65-68 that create the SOPS age key file.)

**Step 2: Remove sops-age-key from Docker build secret-files**

Change lines 123-125 from:

```yaml
          secret-files: |
            ${{ matrix.needs-secrets && format('"fontawesome-auth={0}"', env.FONTAWESOME_SECRET_FILE) || '' }}
            ${{ matrix.needs-secrets && format('"sops-age-key={0}"', env.SOPS_AGE_KEY_FILE) || '' }}
```

to:

```yaml
          secret-files: |
            ${{ matrix.needs-secrets && format('"fontawesome-auth={0}"', env.FONTAWESOME_SECRET_FILE) || '' }}
```

**Step 3: Commit**

```bash
git add .github/workflows/push-to-github-packages.yaml
git commit -m "ci: remove SOPS age key from Docker build secrets

The Docker image no longer needs SOPS at build time for asset precompile.
Only the fontawesome token is still needed as a build secret."
```

---

### Task 12: Update CI workflow — run-e2e-tests.yaml

**Files:**
- Modify: `.github/workflows/run-e2e-tests.yaml:42-53,70-72`

**Step 1: Update the decrypt step to extract RAILS_MASTER_KEY instead of SOPS_AGE_KEY file**

Change the "Decrypt and export secrets" step:

```yaml
      - name: Decrypt and export secrets
        run: |
          # Extract FontAwesome token and create secret file for Docker
          sops -d --extract '["fontawesome"]["auth_token"]' config/secrets/test.sops.yaml > dockerfiles/fontawesome-auth.secret
          chmod 600 dockerfiles/fontawesome-auth.secret

          # Extract Rails master key for credential decryption
          RAILS_MASTER_KEY=$(sops -d --extract '["rails"]["master_key"]' config/secrets/e2e.sops.yaml)
          echo "RAILS_MASTER_KEY=${RAILS_MASTER_KEY}" >> $GITHUB_ENV

          # Export FontAwesome token for bundle install
          echo "BUNDLE_DL__FONTAWESOME__COM=$(cat dockerfiles/fontawesome-auth.secret)" >> $GITHUB_ENV
```

(Removed: creating `dockerfiles/sops-age-key.secret` and the old `chmod` line.)

**Step 2: Replace SOPS_AGE_KEY with RAILS_MASTER_KEY in compose action**

Change lines 70-72 from:

```yaml
      - uses: hoverkraft-tech/compose-action@v2.0.1
        env:
          SOPS_AGE_KEY: ${{ secrets.SOPS_AGE_KEY }}
```

to:

```yaml
      - uses: hoverkraft-tech/compose-action@v2.0.1
        env:
          RAILS_MASTER_KEY: ${{ env.RAILS_MASTER_KEY }}
```

**Step 3: Commit**

```bash
git add .github/workflows/run-e2e-tests.yaml
git commit -m "ci: replace SOPS_AGE_KEY with RAILS_MASTER_KEY in E2E workflow"
```

---

### Task 13: Slim down SOPS secret files

**Files:**
- Modify: `config/secrets/development.sops.yaml`
- Modify: `config/secrets/test.sops.yaml`
- Modify: `config/secrets/e2e.sops.yaml`
- Modify: `config/secrets/production.sops.yaml`

**Step 1: Edit each SOPS file to remove the credentials section**

For each environment:

```bash
sops config/secrets/development.sops.yaml
```

In the editor, remove the entire `credentials:` key and its contents. Keep only:

```yaml
rails:
  master_key: <existing value>
fontawesome:
  auth_token: <existing value>
minio:
  access_key: <existing value>
  secret_key: <existing value>
```

Also remove any top-level keys that were only for app use (like `sentry:`, `github:` in development) — move those into Rails credentials if not already there.

Repeat for `test.sops.yaml`, `e2e.sops.yaml`, and `production.sops.yaml`.

**Step 2: Verify SOPS files still decrypt**

```bash
sops -d config/secrets/development.sops.yaml
sops -d config/secrets/test.sops.yaml
sops -d config/secrets/e2e.sops.yaml
sops -d config/secrets/production.sops.yaml
```

Expected: each shows only the infra keys.

**Step 3: Commit**

```bash
git add config/secrets/*.sops.yaml
git commit -m "feat: remove credentials section from SOPS files

SOPS now only stores infrastructure keys: rails master keys,
fontawesome token, and minio credentials. Application secrets
are in Rails encrypted credentials."
```

---

### Task 14: Update config/secrets/README.md

**Files:**
- Modify: `config/secrets/README.md`

**Step 1: Update to reflect new purpose**

```markdown
# SOPS Secrets Directory

This directory contains SOPS-encrypted infrastructure keys. Application secrets are in Rails encrypted credentials (`config/credentials/*.yml.enc`).

## Files

- **`development.sops.yaml`** - Development infra keys (encrypted, safe to commit)
- **`test.sops.yaml`** - Test infra keys (encrypted, safe to commit)
- **`e2e.sops.yaml`** - E2E infra keys (encrypted, safe to commit)
- **`production.sops.yaml`** - Production infra keys (encrypted, safe to commit)

## What's stored here

Only infrastructure keys that are needed by scripts, CI, and Docker builds:

- `rails.master_key` — Rails credential encryption key (extracted into `config/credentials/*.key`)
- `fontawesome.auth_token` — FontAwesome Pro npm/bundler auth token
- `minio.access_key` / `minio.secret_key` — MinIO S3 credentials for docker-compose

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
```

**Step 2: Commit**

```bash
git add config/secrets/README.md
git commit -m "docs: update config/secrets/README.md for infra-keys-only scope"
```

---

### Task 15: Delete MIGRATION_SUMMARY.md

**Files:**
- Delete: `MIGRATION_SUMMARY.md`

**Step 1: Delete the file**

```bash
git rm MIGRATION_SUMMARY.md
git commit -m "docs: remove obsolete MIGRATION_SUMMARY.md"
```

---

### Task 16: Update documentation (README.md, SECRETS.md, CLAUDE.md)

**Files:**
- Modify: `README.md`
- Modify: `SECRETS.md`
- Modify: `CLAUDE.md`

**Step 1: Update README.md**

In the "Secrets Management" section, replace the SOPS application code examples with standard Rails credentials. Remove references to `Rails.application.sops`. The quick reference for SOPS should mention it's for infra keys only. Add info about `RAILS_MASTER_KEY`.

Replace the "In Application Code" section with:

```markdown
### In Application Code

Access secrets via standard Rails encrypted credentials:

```ruby
# Standard Rails credentials (per-environment)
Rails.application.credentials.dig(:mailtrap, :username)
Rails.application.credentials.dig(:sentry, :frontend_dsn)
Rails.application.credentials.recaptcha[:site_key]
```

**SOPS is only used for infrastructure keys** (fontawesome token, minio credentials, Rails master keys). These are extracted by `bin/setup`, CI workflows, and Docker builds — the running Rails app does not use SOPS.
```

**Step 2: Update SECRETS.md**

Rewrite to reflect the new architecture:
- SOPS section covers only infra keys
- Add a Rails credentials section explaining per-environment setup
- Remove all `Rails.application.sops` references
- Remove the "Backward Compatibility with Rails.application.credentials" section
- Update the "Adding New Secrets" section to use `rails credentials:edit`

**Step 3: Update CLAUDE.md**

Remove `@SECRETS.md` from context references if it's now mostly about SOPS infra (or keep it if still relevant). Update the "Development Notes" or add a section explaining:
- Application secrets: `rails credentials:edit --environment <env>`
- Infrastructure keys: SOPS files in `config/secrets/`
- Remove references to `Rails.application.sops`

**Step 4: Commit**

```bash
git add README.md SECRETS.md CLAUDE.md
git commit -m "docs: update documentation for Rails credentials + SOPS infra-only architecture"
```

---

### Task 17: Update fundamento-infra — Kubernetes manifests

**Repo:** `../fundamento-infra`

**Files:**
- Modify: `kubernetes/apps/prod/fundamento-cloud/app-secrets.yaml`
- Modify: `kubernetes/apps/base/fundamento-cloud/website/deployment.yaml:51-55`
- Modify: `kubernetes/apps/base/fundamento-cloud/jobs/deployment.yaml:51-55`
- Modify: `kubernetes/apps/prod/fundamento-cloud/app-secrets.example.yaml:11-12`

**Step 1: Update app-secrets.yaml — replace SOPS_AGE_KEY with RAILS_MASTER_KEY**

```bash
cd ../fundamento-infra
sops kubernetes/apps/prod/fundamento-cloud/app-secrets.yaml
```

In the editor:
- Remove the `SOPS_AGE_KEY` key
- Add `RAILS_MASTER_KEY` with the production Rails master key value (get it from `sops -d --extract '["rails"]["master_key"]' ../fundamento-cloud/config/secrets/production.sops.yaml`)

The resulting plaintext should look like:

```yaml
apiVersion: v1
kind: Secret
metadata:
    name: app-secrets
    namespace: fundamento-cloud
type: Opaque
stringData:
    DATABASE_URL: <existing value>
    REDIS_URL: <existing value>
    SECRET_KEY_BASE: <existing value>
    RAILS_MASTER_KEY: <production master key>
```

**Step 2: Update website deployment.yaml**

Change lines 51-55 from:

```yaml
            - name: SOPS_AGE_KEY
              valueFrom:
                secretKeyRef:
                  key: SOPS_AGE_KEY
                  name: app-secrets
```

to:

```yaml
            - name: RAILS_MASTER_KEY
              valueFrom:
                secretKeyRef:
                  key: RAILS_MASTER_KEY
                  name: app-secrets
```

**Step 3: Update jobs deployment.yaml**

Same change — lines 51-55, replace `SOPS_AGE_KEY` with `RAILS_MASTER_KEY`.

**Step 4: Update app-secrets.example.yaml**

```yaml
apiVersion: v1
kind: Secret
metadata:
 name: app-secrets
 namespace: fundamento-cloud
type: Opaque
stringData:
  DATABASE_URL: postgres://user:password@host:5432/db
  REDIS_URL: redis://user:password@host:6379
  SECRET_KEY_BASE: foo
  RAILS_MASTER_KEY: your-rails-master-key-here
```

**Step 5: Commit**

```bash
git add kubernetes/apps/prod/fundamento-cloud/app-secrets.yaml \
        kubernetes/apps/base/fundamento-cloud/website/deployment.yaml \
        kubernetes/apps/base/fundamento-cloud/jobs/deployment.yaml \
        kubernetes/apps/prod/fundamento-cloud/app-secrets.example.yaml
git commit -m "feat: replace SOPS_AGE_KEY with RAILS_MASTER_KEY for fundamento-cloud

Rails app no longer uses SOPS at runtime. Pass RAILS_MASTER_KEY for
standard Rails encrypted credential decryption."
```

---

### Task 18: Run full test suite and verify

**Step 1: Run RSpec tests**

```bash
cd /path/to/fundamento-cloud
bundle exec rspec
```

Expected: all tests pass.

**Step 2: Verify Rails console access to credentials**

```bash
rails runner "
  puts 'formula_eval: ' + Rails.application.credentials.dig(:formula_eval, :jwt_secret_key).to_s
  puts 'posthog: ' + Rails.application.credentials.dig(:posthog, :api_key).to_s
"
```

Expected: prints actual values (not nil).

**Step 3: Verify Docker build**

```bash
bin/docker-build-local production
```

Expected: builds successfully without SOPS in the final image.

**Step 4: Verify E2E environment (if time permits)**

```bash
bin/dev-e2e up --test
```

Expected: E2E environment starts and tests run.

---

### Task 19: Deployment coordination

This is a manual step — deploy infra changes first, then app changes.

**Step 1: Deploy infra changes**

Push the `fundamento-infra` changes. FluxCD will reconcile and update the `app-secrets` Kubernetes Secret to include `RAILS_MASTER_KEY` (and still include `SOPS_AGE_KEY` temporarily since the old app version expects it).

**Step 2: Verify the secret is updated in the cluster**

```bash
kubectl -n fundamento-cloud get secret app-secrets -o jsonpath='{.data.RAILS_MASTER_KEY}' | base64 -d
```

Expected: prints the production master key.

**Step 3: Deploy app changes**

Push the `fundamento-cloud` changes. CI builds the new Docker image (without SOPS in final stage). FluxCD deploys the new image which reads `RAILS_MASTER_KEY` from the Kubernetes Secret.

**Step 4: After successful deployment, clean up SOPS_AGE_KEY from infra**

Once the new app is running and healthy, edit `app-secrets.yaml` in the infra repo to remove the now-unused `SOPS_AGE_KEY` entry. This is a cleanup step and is not time-critical.

**Step 5: Verify production**

Check the application logs for any credential-related errors. Verify key features work (login, sentry reporting, mailtrap emails, etc.).
