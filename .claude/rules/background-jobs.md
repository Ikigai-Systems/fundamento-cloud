---
globs: ["app/jobs/**/*.rb", "spec/jobs/**/*.rb"]
---

# Background Jobs

- Pass model objects directly to `perform` — Rails serializes them via GlobalID. Don't pass raw IDs.
- `ApplicationJob` already handles `ActiveJob::DeserializationError` — don't add `discard_on` for it in individual jobs.
- Use `before_enqueue { throw :abort unless <condition> }` to prevent scheduling when a feature is disabled or credentials are missing.
- Use `retry_on` with `wait: :polynomially_longer` for external API errors.

## Idempotent record creation under concurrent execution

GoodJob can dispatch the same job to multiple threads simultaneously (e.g., during rolling deployments when SIGTERM causes rapid lock release and retry). Guard against duplicate record creation with a pessimistic lock at the top of the transaction:

```ruby
ActiveRecord::Base.transaction do
  locked = MyModel.lock.find(record.id)   # SELECT FOR UPDATE — serializes concurrent threads
  raise ActiveRecord::Rollback if locked.completed? || locked.failed?

  # ... create records, mark completed, increment counters ...
  locked.update!(status: :completed, ...)
end
```

Key points:
- `Model.lock.find(id)` holds the row lock for the duration of the transaction. The second concurrent thread waits, then sees `:completed` and rolls back cleanly.
- `ActiveRecord::Rollback` is handled internally by `transaction` — it rolls back and returns `nil` from the block without propagating to any outer `rescue StandardError`.
- The lock is always released at transaction end (COMMIT, ROLLBACK, or connection close) — it can never get stuck.
- Keep the transaction short: do slow network I/O (S3, HTTP) *before* the transaction starts so the lock isn't held during network waits.

## GoodJob + Kubernetes concurrency keys

- **Never use `Process.pid`** in a `good_job_control_concurrency_with` key — every container's main process has PID 1, collapsing all pods onto a single global semaphore slot.
- Use `ENV.fetch("HOSTNAME", Socket.gethostname)` instead — Kubernetes sets `HOSTNAME` to the unique pod name.
- For `ConcurrencyExceededError`, override the default polynomial backoff with a short fixed wait so queued jobs resume quickly once the slot frees:
  ```ruby
  retry_on GoodJob::ActiveJobExtensions::Concurrency::ConcurrencyExceededError,
    wait: 5.seconds,
    attempts: Float::INFINITY
  ```
