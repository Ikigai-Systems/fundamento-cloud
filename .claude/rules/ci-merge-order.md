# Branch currency and CI trust

A pull request's green checks describe the branch *as it was*, merged with master *as it
was*. They say nothing once another PR merges underneath it. Master has no required status
checks and does not require branches to be up to date, so nothing enforces this.

This produced three separate failures in one day. #173 and #174 moved document content
into `object_contents` and dropped `documents.sync`. #165 had been validated against the
older master, merged afterwards, and left `document-attachment-links.cy.js` failing on
master for everyone. The same stale assumption then broke #167's backfill spec and its
E2E run.

- **Rebase onto `origin/master` and re-run the suite before pushing** a branch that has
  been open longer than a few hours, or that touches models, schema or specs.
- **Run the suite after rebasing, not before.** A green run on a stale branch is the
  signal that hid this twice.
- **Treat a green report as expiring** the moment anything merges to master. Re-check
  before merging rather than trusting an earlier notification.
- `gh pr merge --auto` does **not** queue on this repo: `allow_auto_merge` is false, so it
  merges immediately with checks still pending. Monitor and merge explicitly instead.
