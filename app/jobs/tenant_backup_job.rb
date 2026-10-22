# Takes the nightly archive of every organization.
#
# Tenant exports shipped with no schedule, so an archive was only taken when somebody
# remembered to run `rake tenant:export`. This is the schedule.
#
# One job working through the organizations in turn, rather than one TenantExportJob each:
# exports run one at a time anyway, and a queue of jobs waiting on that slot would each
# retry every few seconds for the length of the whole run.
#
# Organizations backed up recently are skipped, so a run cut short by a deploy picks up
# where it stopped when GoodJob retries it, instead of starting over from the first tenant.
class TenantBackupJob < ApplicationJob
  include GoodJob::ActiveJobExtensions::Concurrency

  queue_as :maintenance

  # Only where a separate exports service is configured (the hosted cloud). Without one the
  # archives would land in the application's own bucket, which nothing ever expires, and grow
  # by a full copy of every tenant each night. Self-hosted operators opt in by setting
  # TENANT_EXPORT_SERVICE.
  before_enqueue { throw :abort if Rails.application.config.tenant_export_service.blank? }

  # Short of a day, so that a run starting slightly earlier than last night's still
  # exports everything.
  FRESH_WITHIN = 20.hours

  # The same key as TenantExportJob, so a nightly run and a TenantExportJob never read two
  # tenants at once.
  good_job_control_concurrency_with(
    perform_limit: 1,
    key: -> { TenantExportJob.concurrency_limit_key },
  )

  retry_on GoodJob::ActiveJobExtensions::Concurrency::ConcurrencyExceededError,
    wait: 5.seconds,
    attempts: Float::INFINITY

  def perform
    fresh = TenantExport.completed.where(created_at: FRESH_WITHIN.ago..).select(:organization_id)
    exported = failed = 0

    Organization.kept.where.not(id: fresh).find_each do |organization|
      TenantExport.run!(organization)
      exported += 1
    rescue StandardError => e
      # TenantExport has already recorded the failure. One tenant failing must not leave
      # every tenant after it without a backup, so report it and carry on.
      Sentry.capture_exception(e, extra: { organization_id: organization.id })
      failed += 1
    end

    Rails.logger.info("TenantBackupJob: exported #{exported} organizations, #{failed} failed")
  end
end
