# Dev Browser Sessions

## Problem

Switching between user accounts during development requires manually typing credentials into the login form. Running multiple accounts simultaneously is impossible without browser profile gymnastics. There's no scriptable way to open an authenticated browser session for agent-browser automation.

## Solution

Two-part approach: a dev-only Rack middleware for instant sign-in, and a shell script to launch isolated Chrome sessions per user.

### Part 1: Rack Middleware — DevSignInBackdoor

**File**: `lib/middleware/dev_sign_in_backdoor.rb`
**Mounted in**: `config/environments/development.rb`

Intercepts requests with `?as=<email>` query parameter:

- Guards on `Rails.env.development?`
- Finds user by email via `User.find_by(email:)`
- Signs in via `env["warden"].set_user(user, scope: :user)`
- Strips `?as=` param and redirects (302) to the clean URL
- If user not found, ignores the param and continues normally

### Part 2: Shell Script — `bin/browser-session-for`

**Usage**: `bin/browser-session-for sarah@brightpath.example.com`

Behavior:

1. Detects Chrome path — macOS (`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`) and Linux (`google-chrome`, `google-chrome-stable`, `chromium-browser`)
2. Creates `tmp/browser-sessions/<email>/` directory for Chrome user data
3. Assigns a deterministic `--remote-debugging-port` per email (hash email to port in 9200-9299 range)
4. Writes the port number to `tmp/browser-sessions/<email>/debug-port`
5. Opens `http://localhost:3000/?as=<email>`
6. Chrome persists cookies in the user-data-dir — subsequent launches are already logged in
7. Prints the debugging port to stdout
8. `--list` flag shows available seed accounts (parsed from `db/seeds.rb`)

Cross-platform: macOS and Linux. No Node/Python dependencies — pure bash + Chrome.

### Session directory structure

```
tmp/browser-sessions/
  sarah@brightpath.example.com/
    debug-port          # contains e.g. "9223"
    Default/            # Chrome profile data (cookies, localStorage, etc.)
    ...
  james@brightpath.example.com/
    debug-port
    Default/
    ...
```

### What this doesn't do

- No Windows support
- No automatic session cleanup (manual `rm -rf tmp/browser-sessions/`)
- No changes to production code paths
