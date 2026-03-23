# Dev Browser Sessions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Provide a one-command way to open authenticated Chrome sessions per user account in development, with session persistence and agent-browser compatibility.

**Architecture:** A dev-only Rack middleware (`DevSignInBackdoor`) intercepts `?as=<email>` and signs in via Warden. A `bin/browser-session-for` shell script launches Chrome with per-user `--user-data-dir` for session isolation and `--remote-debugging-port` for agent-browser connectivity.

**Tech Stack:** Ruby (Rack middleware), Bash (shell script), Chrome DevTools Protocol

---

### Task 1: Create the DevSignInBackdoor Rack Middleware

**Files:**
- Create: `lib/middleware/dev_sign_in_backdoor.rb`

**Step 1: Write the middleware**

```ruby
# frozen_string_literal: true

# Development-only middleware that allows instant sign-in via ?as=<email> query parameter.
# Strips the parameter and redirects to the clean URL after signing in.
#
# Usage: http://localhost:3000/?as=sarah@brightpath.example.com
# Usage: http://localhost:3000/some/path?as=sarah@brightpath.example.com
class DevSignInBackdoor
  def initialize(app)
    @app = app
  end

  def call(env)
    return @app.call(env) unless Rails.env.development?

    request = Rack::Request.new(env)
    email = request.params["as"]

    if email.present?
      user = User.find_by(email: email)
      if user
        env["warden"].set_user(user, scope: :user)

        # Strip the ?as= param and redirect to the clean URL
        clean_url = remove_param(request.url, "as")
        return [302, { "Location" => clean_url, "Content-Type" => "text/html" }, ["Redirecting..."]]
      end
    end

    @app.call(env)
  end

  private

  def remove_param(url, param_name)
    uri = URI.parse(url)
    params = Rack::Utils.parse_query(uri.query)
    params.delete(param_name)
    uri.query = params.empty? ? nil : Rack::Utils.build_query(params)
    uri.to_s
  end
end
```

**Step 2: Verify the file was created**

Run: `ruby -c lib/middleware/dev_sign_in_backdoor.rb`
Expected: `Syntax OK`

**Step 3: Commit**

```bash
git add lib/middleware/warden_sign_in_backdoor_for_development.rb
git commit -m "feat: add DevSignInBackdoor middleware for instant dev login"
```

---

### Task 2: Mount the Middleware in Development

**Files:**
- Modify: `config/environments/development.rb:5` (inside the `Rails.application.configure do` block)

**Step 1: Add the middleware require and mount**

Add these two lines right after the opening `Rails.application.configure do` on line 5, before any other config:

```ruby
  require_relative "../../lib/middleware/dev_sign_in_backdoor"
config.middleware.use WardenSignInBackdoorForDevelopment
```

This places them at lines 6-7 of the file, inside the configure block.

**Step 2: Verify Rails boots with the middleware**

Run: `bin/rails middleware | grep DevSignInBackdoor`
Expected output includes: `use DevSignInBackdoor`

**Step 3: Commit**

```bash
git add config/environments/development.rb
git commit -m "feat: mount DevSignInBackdoor middleware in development"
```

---

### Task 3: Write the RSpec test for the middleware

**Files:**
- Create: `spec/middleware/dev_sign_in_backdoor_spec.rb`

**Step 1: Write the test**

```ruby
# frozen_string_literal: true

require "rails_helper"

RSpec.describe WardenSignInBackdoorForDevelopment, type: :request do
  let(:user) { create(:user, email: "test@example.com", password: "password") }

  before do
    # Middleware is only mounted in development, but tests run in test env.
    # We test the middleware class directly instead.
  end

  describe "middleware behavior" do
    let(:inner_app) { ->(env) { [200, { "Content-Type" => "text/html" }, ["OK"]] } }
    let(:middleware) { described_class.new(inner_app) }

    it "passes through requests without ?as= parameter" do
      env = Rack::MockRequest.env_for("http://localhost:3000/")
      env["warden"] = double("warden")

      status, _headers, _body = middleware.call(env)
      expect(status).to eq(200)
    end

    it "signs in user and redirects when ?as= is present in development" do
      allow(Rails).to receive(:env).and_return(ActiveSupport::EnvironmentInquirer.new("development"))

      warden = double("warden")
      expect(warden).to receive(:set_user).with(user, scope: :user)

      env = Rack::MockRequest.env_for("http://localhost:3000/?as=#{user.email}")
      env["warden"] = warden

      status, headers, _body = middleware.call(env)
      expect(status).to eq(302)
      expect(headers["Location"]).to eq("http://localhost:3000/")
    end

    it "preserves other query parameters when redirecting" do
      allow(Rails).to receive(:env).and_return(ActiveSupport::EnvironmentInquirer.new("development"))

      warden = double("warden")
      expect(warden).to receive(:set_user).with(user, scope: :user)

      env = Rack::MockRequest.env_for("http://localhost:3000/some/path?as=#{user.email}&foo=bar")
      env["warden"] = warden

      status, headers, _body = middleware.call(env)
      expect(status).to eq(302)
      expect(headers["Location"]).to eq("http://localhost:3000/some/path?foo=bar")
    end

    it "passes through when email is not found" do
      allow(Rails).to receive(:env).and_return(ActiveSupport::EnvironmentInquirer.new("development"))

      warden = double("warden")
      env = Rack::MockRequest.env_for("http://localhost:3000/?as=nobody@example.com")
      env["warden"] = warden

      status, _headers, _body = middleware.call(env)
      expect(status).to eq(200)
    end

    it "does not sign in when not in development environment" do
      allow(Rails).to receive(:env).and_return(ActiveSupport::EnvironmentInquirer.new("production"))

      warden = double("warden")
      expect(warden).not_to receive(:set_user)

      env = Rack::MockRequest.env_for("http://localhost:3000/?as=#{user.email}")
      env["warden"] = warden

      status, _headers, _body = middleware.call(env)
      expect(status).to eq(200)
    end
  end
end
```

**Step 2: Run the tests**

Run: `bin/rspec spec/middleware/dev_sign_in_backdoor_spec.rb`
Expected: All 5 examples pass

**Step 3: Commit**

```bash
git add spec/middleware/dev_sign_in_backdoor_spec.rb
git commit -m "test: add specs for DevSignInBackdoor middleware"
```

---

### Task 4: Create the browser-session-for shell script

**Files:**
- Create: `bin/browser-session-for`

**Step 1: Write the script**

```bash
#!/usr/bin/env bash
set -euo pipefail

# bin/browser-session-for - Launch an isolated Chrome session for a dev user account.
#
# Usage:
#   bin/browser-session-for sarah@brightpath.example.com
#   bin/browser-session-for --list
#
# Each email gets its own Chrome profile directory (tmp/browser-sessions/<email>/)
# with persistent cookies/localStorage. A unique --remote-debugging-port is assigned
# per email so agent-browser can connect.

APP_PORT="${APP_PORT:-3000}"
APP_URL="http://localhost:${APP_PORT}"
SESSIONS_DIR="tmp/browser-sessions"

# ─── Find Chrome ──────────────────────────────────────────────

find_chrome() {
  # macOS
  if [[ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]]; then
    echo "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    return
  fi

  # Linux (try common names)
  for cmd in google-chrome google-chrome-stable chromium-browser chromium; do
    if command -v "$cmd" &>/dev/null; then
      echo "$cmd"
      return
    fi
  done

  echo "Error: Google Chrome not found." >&2
  echo "  macOS: Install from https://www.google.com/chrome/" >&2
  echo "  Linux: apt install google-chrome-stable (or chromium-browser)" >&2
  exit 1
}

# ─── Deterministic port from email ────────────────────────────

debug_port_for() {
  local email="$1"
  # Hash email to a number in range 9200-9299
  local hash
  hash=$(printf '%s' "$email" | cksum | awk '{print $1}')
  echo $(( 9200 + (hash % 100) ))
}

# ─── List seed accounts ──────────────────────────────────────

list_accounts() {
  local seeds_file="db/seeds/organizations/marketing_agency/seed.rb"
  echo "Available seed accounts (password: \"password\"):"
  echo ""
  if [[ -f "$seeds_file" ]]; then
    grep -oE '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]+' "$seeds_file" | sort -u | while read -r email; do
      local port
      port=$(debug_port_for "$email")
      printf "  %-40s (debug port: %s)\n" "$email" "$port"
    done
  else
    echo "  No seed file found at $seeds_file"
  fi
  echo ""
  echo "Usage: bin/browser-session-for <email>"
}

# ─── Main ─────────────────────────────────────────────────────

if [[ "${1:-}" == "--list" ]] || [[ "${1:-}" == "-l" ]]; then
  list_accounts
  exit 0
fi

if [[ -z "${1:-}" ]]; then
  echo "Usage: bin/browser-session-for <email>"
  echo "       bin/browser-session-for --list"
  exit 1
fi

EMAIL="$1"
CHROME=$(find_chrome)
USER_DATA_DIR="${SESSIONS_DIR}/${EMAIL}"
DEBUG_PORT=$(debug_port_for "$EMAIL")

# Create session directory
mkdir -p "$USER_DATA_DIR"

# Write debug port for easy reference
echo "$DEBUG_PORT" > "${USER_DATA_DIR}/debug-port"

echo "Opening Chrome session for: $EMAIL"
echo "  User data dir:  $USER_DATA_DIR"
echo "  Debug port:     $DEBUG_PORT"
echo "  App URL:        $APP_URL"
echo ""
echo "To connect with agent-browser:"
echo "  npx agent-browser --remote-debugging-port=$DEBUG_PORT"
echo ""

# Launch Chrome with isolated profile
exec "$CHROME" \
  --user-data-dir="$(pwd)/$USER_DATA_DIR" \
  --remote-debugging-port="$DEBUG_PORT" \
  --no-first-run \
  --no-default-browser-check \
  "${APP_URL}/?as=${EMAIL}"
```

**Step 2: Make it executable**

Run: `chmod +x bin/browser-session-for`

**Step 3: Verify it runs (help output)**

Run: `bin/browser-session-for --list`
Expected: Lists seed accounts with debug ports

**Step 4: Commit**

```bash
git add bin/browser-session-for
git commit -m "feat: add bin/browser-session-for for isolated dev browser sessions"
```

---

### Task 5: Add tmp/browser-sessions to .gitignore

**Files:**
- Modify: `.gitignore`

**Step 1: Add the entry**

Append to `.gitignore`:
```
# Dev browser sessions (Chrome user data dirs)
/tmp/browser-sessions/
```

**Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: gitignore dev browser session data"
```

---

### Task 6: Update CLAUDE.md with browser session docs

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add a section after the "Development Seeds" section**

Add after the seed section:

```markdown
## Dev Browser Sessions

Open isolated Chrome sessions pre-authenticated as any dev user:

```bash
# List available accounts
bin/browser-session-for --list

# Open a session (launches Chrome, auto-logs in)
bin/browser-session-for sarah@brightpath.example.com

# Open a second session simultaneously
bin/browser-session-for james@brightpath.example.com
```

Each session gets its own Chrome profile (`tmp/browser-sessions/<email>/`) with persistent cookies. The debug port is written to `tmp/browser-sessions/<email>/debug-port` and printed to stdout for agent-browser connectivity:

```bash
npx agent-browser --remote-debugging-port=$(cat tmp/browser-sessions/sarah@brightpath.example.com/debug-port)
```

Requires the Rails dev server running (`bin/dev`) and uses the `?as=<email>` backdoor (dev-only middleware) for instant login.
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add dev browser sessions section to CLAUDE.md"
```
