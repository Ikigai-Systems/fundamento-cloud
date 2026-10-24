# CI skip labels

A PR can skip CI steps it cannot affect. The `ci-labels` action
(`.github/actions/ci-labels/`) decides from the changed paths and writes three labels:

- `skip-rspec`: the Rails specs may be skipped.
- `skip-e2e`: the Cypress run may be skipped.
- `skip-deploy`: the cloud package/deploy and the standalone publish may be skipped.

Which paths each label covers lives in `rules.yml` next to the action. Don't copy the lists
elsewhere. `skip-deploy` also follows `.dockerignore`: a path that reaches the image never skips.

## Rules of thumb

- **Fail safe.** Any error, a fork PR, a direct push, `workflow_dispatch`, an empty file list or
  3000+ changed files means no labels: everything runs and deploys. Unknown paths run too.
- **Lint & Typecheck always runs.** Labels never touch it.
- **Changing a workflow, or a local action it uses, runs that workflow**, whatever the paths say.
- **No `paths-ignore` on any trigger.** A skipped check still reports success, so these checks
  can become required later. Don't reintroduce path filters.
- `[skip-tests]` / `[skip-deploy]` in commit messages no longer do anything.

## Overriding by hand

Add or remove a label on the PR. Any label change re-runs the RSpec and E2E checks under the
current labels. The override lasts until the next push: the labeler recomputes from the paths on
`opened` / `synchronize` / `reopened`, not on label events, and overwrites your change.

## Why the `ci-labels` status

The labeler sets a `ci-labels` commit status on the PR head once it has written the labels.
After merge, `master` workflows (the push and `workflow_run` triggers) read the labels of the
merged PR only if that status is present. Without it the labels might be stale or hand-made, so
master ignores them and runs everything. Labels written with `GITHUB_TOKEN` don't trigger
workflows, so each workflow runs its own `decide` job rather than waiting for the labeler.

## Changing the rules

Add a path to the matching list in `rules.yml` (`skippable`, `except`, or the shared `no_check`).
`bin/rspec spec/ci` pins the expectations: add a case there for the new path, in the same change.

The action is meant to move to `release-kit` once it has proven itself, so keep it free of
anything specific to this repository.
