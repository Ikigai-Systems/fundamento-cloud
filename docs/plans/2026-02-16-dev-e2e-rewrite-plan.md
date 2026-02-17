# bin/dev-e2e Rewrite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite `bin/dev-e2e` as a Ruby Thor CLI with subcommands for the full E2E workflow.

**Architecture:** Single self-contained Ruby script at `bin/dev-e2e` using Thor for subcommand routing. Shared helpers handle env setup, SOPS key loading, permission fixes, and docker compose invocations. Interactive commands (`console`, `shell`) use `Kernel.exec` for TTY passthrough.

**Tech Stack:** Ruby, Thor (transitive dep via Rails), Docker Compose

**Design doc:** `docs/plans/2026-02-16-dev-e2e-rewrite-design.md`

---

### Task 1: Scaffold the Thor CLI with `up` command

**Files:**
- Rewrite: `bin/dev-e2e`

**Step 1: Write the new script**

Replace `bin/dev-e2e` entirely with:

```ruby
#!/usr/bin/env ruby
require "bundler/setup"
require "thor"

class DevE2e < Thor
  PROJECT = "e2e-tests"
  WEBSITE_CONTAINER = "website"

  ENV_VARS = {
    "RAILS_ENV" => "e2e",
    "RAILS_PORT" => "4000",
    "RAILS_LOG_LEVEL" => "debug",
    "POSTGRES_PORT" => "6432",
    "REDIS_PORT" => "7379",
    "MINIO_PORT" => "10000",
    "MINIO_CONSOLE_PORT" => "10001",
    "BLOCKNOTE_PORT" => "4002",
    "HTTP_HOST" => "localhost:4000",
  }

  PERMISSION_EXTENSIONS = %w[rb erb rake js ts yml].freeze
  PERMISSION_EXCLUDE_DIRS = %w[node_modules vendor .git].freeze

  default_command :up

  desc "up", "Tear down, rebuild, and start E2E environment (default command)"
  option :build, type: :boolean, default: true, desc: "Rebuild Docker images (use --no-build to skip)"
  option :test, type: :boolean, default: false, desc: "Run Cypress tests after environment is ready"
  def up
    setup_env!
    load_sops_key!

    print_status

    compose("down")

    fix_permissions! if options[:build]

    args = ["up", "--wait"]
    args << "--build" if options[:build]

    say(options[:build] ? "Rebuilding and starting..." : "Starting (no rebuild)...", :cyan)
    with_terminal_cleanup do
      success = compose(*args)
      unless success
        say("Failed to start E2E environment", :red)
        exit(1)
      end
    end

    say("")
    say("E2E environment is ready!", :green)
    print_hints

    if options[:test]
      say("")
      run_cypress
    end
  end

  desc "down", "Stop E2E containers"
  def down
    setup_env!
    compose("down")
  end

  desc "clean", "Remove all E2E containers, volumes, and images"
  def clean
    setup_env!
    say("Removing all E2E containers, volumes, and local images...", :yellow)
    compose("down", "--volumes", "--remove-orphans", "--rmi", "local")
    say("Clean complete", :green)
  end

  desc "logs", "Stream logs from E2E containers"
  def logs
    setup_env!
    exec_compose("logs", "-f")
  end

  desc "console", "Open Rails console in the website container"
  def console
    ensure_running!
    exec_in_container("bin/rails", "console")
  end

  desc "shell", "Open bash shell in the website container"
  def shell
    ensure_running!
    exec_in_container("bash")
  end

  desc "test", "Run Cypress tests (environment must be running)"
  def test
    run_cypress
  end

  private

  def setup_env!
    ENV_VARS.each { |key, value| ENV[key] = value }
  end

  def load_sops_key!
    return if ENV["SOPS_AGE_KEY"] && !ENV["SOPS_AGE_KEY"].empty?

    secret_file = "dockerfiles/sops-age-key.secret"
    if File.exist?(secret_file)
      key = File.readlines(secret_file)
        .reject { |line| line.start_with?("#") || line.strip.empty? }
        .first&.strip

      if key && !key.empty?
        ENV["SOPS_AGE_KEY"] = key
        say("Loaded SOPS_AGE_KEY from #{secret_file}")
      else
        abort_with_sops_error
      end
    else
      abort_with_sops_error
    end
  end

  def abort_with_sops_error
    say("Error: SOPS_AGE_KEY is not set and dockerfiles/sops-age-key.secret not found!", :red)
    say("")
    say("SOPS_AGE_KEY is required to decrypt secrets for the E2E environment.")
    say("")
    say("Options:")
    say("  1. Run bin/setup to import it from 1password vault")
    say("  2. Export it in your shell: export SOPS_AGE_KEY='your-key-here'")
    say("  3. Pass it inline: SOPS_AGE_KEY='your-key' bin/dev-e2e")
    exit(1)
  end

  def fix_permissions!
    say("Checking file permissions...")

    extensions = PERMISSION_EXTENSIONS.map { |ext| "-name '*.#{ext}'" }.join(" -o ")
    excludes = PERMISSION_EXCLUDE_DIRS.map { |dir| "! -path '*/#{dir}/*'" }.join(" ")

    cmd = "find . -type f \\( #{extensions} \\) #{excludes} ! -perm -044 2>/dev/null"
    files = `#{cmd}`.strip.split("\n").reject(&:empty?)

    return if files.empty?

    say("Found #{files.size} file(s) with restrictive permissions", :yellow)
    files.first(5).each { |f| say("  #{f}") }
    say("  ... and #{files.size - 5} more") if files.size > 5
    say("")

    files.each { |f| File.chmod(0644, f) }
    say("Fixed permissions for #{files.size} file(s)", :green)
    say("")
  end

  def compose(*args)
    cmd = ["docker", "compose", "--ansi", "never", "-p", PROJECT, *args]
    system(*cmd)
  end

  def exec_compose(*args)
    cmd = ["docker", "compose", "--ansi", "never", "-p", PROJECT, *args]
    Kernel.exec(*cmd)
  end

  def exec_in_container(*command)
    container_id = `docker compose -p #{PROJECT} ps -q #{WEBSITE_CONTAINER}`.strip
    if container_id.empty?
      say("E2E environment is not running. Start it with: bin/dev-e2e up", :red)
      exit(1)
    end
    Kernel.exec("docker", "exec", "-it", container_id, *command)
  end

  def ensure_running!
    setup_env!
    container_id = `docker compose -p #{PROJECT} ps -q #{WEBSITE_CONTAINER}`.strip
    if container_id.empty?
      say("E2E environment is not running. Start it with: bin/dev-e2e up", :red)
      exit(1)
    end
  end

  def run_cypress
    say("Running Cypress tests...", :cyan)
    success = system("npx", "cypress", "run", "--project", "spec/e2e")
    exit(success ? 0 : 1)
  end

  def with_terminal_cleanup
    yield
  ensure
    system("tput cnorm 2>/dev/null || printf '\\033[?25h'")
    system("stty echo 2>/dev/null")
  end

  def print_status
    say("E2E environment ports:", :cyan)
    say("  Rails:          http://localhost:#{ENV_VARS["RAILS_PORT"]}")
    say("  MinIO Console:  http://localhost:#{ENV_VARS["MINIO_CONSOLE_PORT"]}")
    say("  PostgreSQL:     localhost:#{ENV_VARS["POSTGRES_PORT"]}")
    say("  Redis:          localhost:#{ENV_VARS["REDIS_PORT"]}")
    say("")
  end

  def print_hints
    say("Quick commands:")
    say("  Logs:     bin/dev-e2e logs")
    say("  Console:  bin/dev-e2e console")
    say("  Shell:    bin/dev-e2e shell")
    say("  Tests:    bin/dev-e2e test")
    say("  Stop:     bin/dev-e2e down")
    say("  Cleanup:  bin/dev-e2e clean")
  end
end

DevE2e.start(ARGV)
```

**Step 2: Make it executable and verify it runs**

Run: `chmod +x bin/dev-e2e`

Then verify help output:

Run: `bin/dev-e2e help`

Expected: Thor auto-generated help listing all subcommands (up, down, clean, logs, console, shell, test).

**Step 3: Verify `bin/dev-e2e help up` shows options**

Run: `bin/dev-e2e help up`

Expected: Shows `--build` / `--no-build` and `--test` options with descriptions.

**Step 4: Commit**

```bash
git add bin/dev-e2e
git commit -m "Rewrite bin/dev-e2e as Ruby Thor CLI

Replaces bash script with Thor subcommands: up, down, clean,
logs, console, shell, test. Build+teardown is now the default
workflow. Adds convenience commands for logs, console, and shell
access."
```

---

### Task 2: Manual smoke test

This is a dev tool, not application code - manual testing is appropriate.

**Step 1: Test the default (up) command**

Run: `bin/dev-e2e`

Expected:
- Loads SOPS key
- Prints port info
- Runs `docker compose down` (may say "no containers" if nothing running)
- Fixes permissions if needed
- Builds and starts containers
- Waits for healthy
- Prints "E2E environment is ready!" and quick commands

**Step 2: Test logs**

Run: `bin/dev-e2e logs` (in separate terminal)

Expected: Streams logs from all containers, Ctrl-C exits.

**Step 3: Test console**

Run: `bin/dev-e2e console`

Expected: Opens interactive Rails console inside the website container.

**Step 4: Test shell**

Run: `bin/dev-e2e shell`

Expected: Opens bash inside the website container.

**Step 5: Test down**

Run: `bin/dev-e2e down`

Expected: Stops all E2E containers.

**Step 6: Test clean**

Run: `bin/dev-e2e clean`

Expected: Removes containers, volumes, and local images.

**Step 7: Test error case - console when not running**

Run (after down): `bin/dev-e2e console`

Expected: "E2E environment is not running. Start it with: bin/dev-e2e up"

**Step 8: Test --no-build**

Run: `bin/dev-e2e up --no-build`

Expected: Skips docker build, just starts existing images.

---

### Task 3: Update README

**Files:**
- Modify: `README.md` (E2E testing section)

**Step 1: Update the E2E section in README**

Replace the E2E commands section to show the new subcommands. The one-liner becomes just `bin/dev-e2e --test`. The management section uses the new subcommands.

**Step 2: Commit**

```bash
git add README.md
git commit -m "Update README E2E section for new bin/dev-e2e CLI"
```
