---
globs: ["app/jobs/**/*.rb", "spec/jobs/**/*.rb"]
---

# Background Jobs

- Pass model objects directly to `perform` — Rails serializes them via GlobalID. Don't pass raw IDs.
- `ApplicationJob` already handles `ActiveJob::DeserializationError` — don't add `discard_on` for it in individual jobs.
- Use `before_enqueue { throw :abort unless <condition> }` to prevent scheduling when a feature is disabled or credentials are missing.
- Use `retry_on` with `wait: :polynomially_longer` for external API errors.
