# Builds one tenant's archive.
#
# Serialised across the fleet rather than merely per-process: an export reads every table
# belonging to a tenant, and several at once on a burstable instance is how taking a
# backup becomes the reason for needing one. GoodJob's key is global, so a second export
# waits rather than competing.
class TenantExportJob < ApplicationJob
  include GoodJob::ActiveJobExtensions::Concurrency

  queue_as :maintenance

  def self.concurrency_limit_key = "tenant-export"

  good_job_control_concurrency_with(
    perform_limit: 1,
    key: -> { TenantExportJob.concurrency_limit_key },
  )

  # A short fixed wait rather than the default polynomial backoff: the slot frees as soon
  # as the running export finishes, and there is no reason to sit out a growing delay.
  retry_on GoodJob::ActiveJobExtensions::Concurrency::ConcurrencyExceededError,
    wait: 5.seconds,
    attempts: Float::INFINITY

  def perform(organization)
    TenantExport.run!(organization)
  end
end
