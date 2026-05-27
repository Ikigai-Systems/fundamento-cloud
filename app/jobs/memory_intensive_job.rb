class MemoryIntensiveJob < ApplicationJob
  include GoodJob::ActiveJobExtensions::Concurrency

  # This way only one job per good job worker process can be run
  good_job_control_concurrency_with(
    perform_limit: 1,
    key: -> { "memory_intensive_#{Process.pid}" },
  )

  # Retry quickly with a short fixed wait instead of polynomial backoff.
  # ConcurrencyExceededError means the pod's slot is taken; the slot frees up
  # as soon as the current job finishes (seconds to minutes), so exponential
  # backoff would cause unnecessarily long waits.
  retry_on GoodJob::ActiveJobExtensions::Concurrency::ConcurrencyExceededError,
    wait: 5.seconds,
    attempts: Float::INFINITY
end