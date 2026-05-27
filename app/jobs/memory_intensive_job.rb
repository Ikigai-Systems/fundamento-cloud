class MemoryIntensiveJob < ApplicationJob
  include GoodJob::ActiveJobExtensions::Concurrency

  # Limit to 1 concurrent memory-intensive job per worker pod. Using the pod
  # hostname (HOSTNAME env var set by Kubernetes) rather than Process.pid because
  # every container's main process has pid 1, which would collapse all pods onto
  # a single global semaphore slot.
  good_job_control_concurrency_with(
    perform_limit: 1,
    key: -> { "memory_intensive_#{ENV.fetch("HOSTNAME", Socket.gethostname)}" },
  )

  # Retry quickly with a short fixed wait instead of polynomial backoff.
  # ConcurrencyExceededError means the pod's slot is taken; the slot frees up
  # as soon as the current job finishes (seconds to minutes), so exponential
  # backoff would cause unnecessarily long waits.
  retry_on GoodJob::ActiveJobExtensions::Concurrency::ConcurrencyExceededError,
    wait: 5.seconds,
    attempts: Float::INFINITY
end