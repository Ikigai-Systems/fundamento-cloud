# Gives every pre-existing table a baseline version, so history does not start empty for
# tables that existed before versioning shipped.
#
# Runs nightly and self-terminates: once every table has a version it finds nothing. A
# rake task would not do -- self-hosted deployments run db:prepare on boot and nothing
# else (see .claude/rules/data-migrations.md).
class TableVersionBackfillJob < ApplicationJob
  BATCH_SIZE = 50

  queue_as :maintenance

  def perform(batch_size: BATCH_SIZE)
    Table.without_archived
         .where.missing(:versions)
         .limit(batch_size)
         .each { |table| TableVersionSnapshotJob.perform_later(table, kind: :initial) }
  end
end
