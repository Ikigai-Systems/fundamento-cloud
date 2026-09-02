# Coalesces a burst of table edits into one version.
#
# The recorder enqueues this with a WINDOW delay on the first change to a table.
# enqueue_limit: 1 makes every subsequent change inside that window ride along instead of
# scheduling its own run -- a leading window rather than a resetting debounce, so version
# latency stays bounded at WINDOW even while someone edits continuously.
class TableVersionSnapshotJob < ApplicationJob
  include GoodJob::ActiveJobExtensions::Concurrency

  WINDOW = 5.minutes

  queue_as :maintenance

  good_job_control_concurrency_with(
    enqueue_limit: 1,
    perform_limit: 1,
    key: -> { "table_snapshot_#{arguments.first&.id}" },
  )

  retry_on GoodJob::ActiveJobExtensions::Concurrency::ConcurrencyExceededError,
    wait: 5.seconds,
    attempts: Float::INFINITY

  before_enqueue { throw :abort unless Tables::ChangeRecorder.enabled? }

  def perform(table, kind: :auto)
    return unless Tables::ChangeRecorder.enabled?

    Tables::VersionSnapshotService.new(table, kind: kind).call
  rescue IndexError => e
    # Table#order_linked_list raises when the row or column chain is broken. That is a
    # data problem in the table itself, not something retrying will fix.
    Sentry.capture_exception(e, extra: { table_id: table.id })
    nil
  end
end
