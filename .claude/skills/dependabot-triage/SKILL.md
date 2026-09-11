---
name: dependabot-triage
description: Triage the weekly batch of Dependabot pull requests in fundamento-cloud - inventory the open bot PRs, read why each one is red, sort them into merge / recombine / reject / fix, and act. Use on the Friday dependency sweep, or whenever the user says "dependabot", "dependency PRs", "bump PRs", "deps PRs", or asks why a dependency bump is failing CI.
---

# Dependabot triage

Dependabot opens PRs weekly (Friday, `interval: weekly` in `.github/dependabot.yml`) across
four ecosystems: bundler `/`, npm `/`, npm `/micro-services/blocknote-converter`, and
github-actions. This skill turns that pile into merges, closures, and a short list of real
work — cheapest decisions first.

## Quick start

```bash
# 1. Inventory
gh pr list --author "app/dependabot" --state open --limit 50 \
  --json number,title,createdAt,mergeStateStatus \
  --template '{{range .}}{{.number}}	{{.createdAt}}	{{.mergeStateStatus}}	{{.title}}{{"\n"}}{{end}}'

# 2. Per PR, see which checks are red
gh pr checks <N>

# 3. Get the *actual* error out of a failing job (logs are 95% runner noise)
scripts/why-failed.sh <job-url-or-id>
```

Then classify each PR with the decision tree below and work the buckets in order:
**A (merge) → B (recombine) → C (reject) → D (fix)**.

## Step 1 — Establish a baseline first

Before blaming any PR, know what master does on its own. `run-e2e-tests` is
**flaky on master** — two specs (`table-crud` add-row, `document-editing-sessions`)
fail on a clean baseline. Diff a PR's failures against that baseline rather than
treating any red E2E as the PR's fault.

Also confirm master is current (`git fetch origin && git rev-list --left-right --count HEAD...origin/master`).
Per `.claude/rules/ci-merge-order.md`, a bot PR opened last week was validated against a
master that no longer exists — its green checks have expired.

## Step 2 — Read the real failure

`gh run view --job <id> --log-failed` returns hundreds of lines of checkout/cleanup noise.
Use the helper, which strips the `job\tstep\ttimestamp` prefix and keeps only lines that
carry a diagnosis:

```bash
scripts/why-failed.sh 103201174811
scripts/why-failed.sh https://github.com/Ikigai-Systems/fundamento-cloud/actions/runs/34580022116/job/103201174811
```

Almost every red Dependabot PR is one of two shapes, and both are visible in the first
20 lines of output:

- `npm error code ERESOLVE` — a peer dependency conflict. The install never ran; no test
  result on the PR means anything.
- A test/typecheck failure — the install worked and the new version genuinely broke code.

## Step 3 — Classify

```
Is the PR green?
├─ yes ─────────────────────────────────────────────► BUCKET A: merge
└─ no → run scripts/why-failed.sh
   ├─ ERESOLVE, and the conflicting package is bumped
   │  by ANOTHER open Dependabot PR ──────────────────► BUCKET B: recombine
   ├─ ERESOLVE against a ceiling we cannot move
   │  (upstream peer range excludes the new version,
   │   latest + alpha included) ──────────────────────► BUCKET C: reject
   └─ tests/typecheck fail after a successful install ► BUCKET D: fix
```

Distinguishing B from C is the whole job, and it is one command:

```bash
npm view <blocking-package>@latest version peerDependencies
npm view <blocking-package> versions --json | tail   # check alphas too
```

If some published version accepts the new dependency, it's B (bump them together).
If nothing does, it's C (the ecosystem is not ready — reject).

## Step 4 — Act per bucket

### Bucket A — green, merge

```bash
gh pr checks <N>          # re-verify now, not from an old notification
gh pr merge <N> --squash
```

`gh pr merge --auto` does **not** queue on this repo (`allow_auto_merge` is false) — it
merges immediately with checks still pending. Merge explicitly, one at a time, and
re-check the next PR after each merge.

### Bucket B — recombine a split pair

Dependabot's groups in `.github/dependabot.yml` exist to prevent this, but they do not
always hold: in Sept 2026 it split vitest 5 into #181 (`vitest`) and #186 (`@vitest/ui`)
despite both matching the converter's `vitest` group. `@vitest/ui` peers an **exact**
`vitest` version, so each PR alone fails `npm ci`.

Do not try to patch one bot branch onto the other. Open one replacement PR:

```bash
git checkout -b deps/<thing>-<major> origin/master
cd <the right directory>            # root, or micro-services/blocknote-converter
npm install --save-dev pkg-a@^X pkg-b@^X
npm ci                              # the exact thing CI runs — must not ERESOLVE
```

Verify, commit both `package.json` and `package-lock.json`, and say
"Supersedes #A and #B" in the body so the bot PRs can be closed with a pointer.

### Bucket C — reject and record why

Closing the PR alone is not enough: Dependabot re-proposes the next patch release next
Friday and you re-litigate it weekly. Add an ignore entry to `.github/dependabot.yml`
**in the same PR**, with a comment naming the blocking peer range and the condition for
removing the entry.

```yaml
    ignore:
      # typescript-eslint 8.70.0 -- the newest release, alphas included -- peers
      # typescript ">=4.8.4 <6.1.0". TypeScript 7 cannot install alongside it
      # (see PR #127). Remove this once typescript-eslint widens that range.
      - dependency-name: "typescript"
        update-types: ["version-update:semver-major"]
```

Apply the ignore to **every** ecosystem block that ships the package — root and
`/micro-services/blocknote-converter` both pin `typescript` and `typescript-eslint`.
Validate before pushing:

```bash
ruby -ryaml -e 'YAML.safe_load_file(".github/dependabot.yml"); puts "YAML OK"'
```

Then close the bot PR with a comment explaining the block and linking the config change.

### Bucket D — real breakage, real work

The install succeeded and the new major changed behaviour. Take it on a branch, one PR
per dependency. Reproduce locally before reading release notes — the failure tells you
which subsystem moved. If the fix is larger than the bump is worth, demote it to
bucket C with an ignore entry and a note.

## Per-ecosystem gotchas

- **`micro-services/blocknote-converter` is a separate npm project.** Its `typecheck`,
  `lint` and `test` are not covered by the app's. Run all of them from inside that
  directory. `npm run build` uses esbuild and does **not** typecheck, so a green build
  still ships type errors. See `.claude/rules/blocknote-converter.md`.
- **It pins its own `@blocknote/core`** (0.54.0) while the app pins 0.52.1. Read API
  source from the `node_modules` of the project you are changing.
- **React 18 → 19 is deliberately deferred.** Any bump whose peer range demands React 19
  (`@mantine/core` 9, and others as they land) belongs to that migration, not to a weekly
  sweep — bucket C, and reference the existing React entries in the ignore list.
- **Ruby/bundler PRs** carry no lockfile peer resolution, so they are almost always
  bucket A or D. Run `bin/rspec` rather than trusting the bot.

## Closing out

For each bucket-C closure and each bucket-B supersession, leave a comment on the bot PR
pointing at the replacement or the ignore entry, so next Friday's sweep does not
re-investigate a decision already made.

If a rejection reason is likely to resurface (an upstream peer ceiling, a deferred
migration), the ignore comment in `.github/dependabot.yml` is the durable record —
prefer it over a note anywhere else.
