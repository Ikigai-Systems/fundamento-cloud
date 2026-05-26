class MemoryIntensiveJob < ApplicationJob
  include GoodJob::ActiveJobExtensions::Concurrency

  # This way only one job per good job worker process can be run
  good_job_control_concurrency_with(
    perform_limit: 1,
    key: -> { "memory_intensive_#{Process.pid}" },
  )
end