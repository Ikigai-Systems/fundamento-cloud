# Carries the acting user and the origin of a write down to the model layer, where table
# change events are recorded. Audited::Sweeper does the equivalent for the audits table;
# this is the same idea, owned by us, and set explicitly in jobs and MCP requests where
# there is no controller to infer it from.
class Current < ActiveSupport::CurrentAttributes
  SOURCES = %w[ui formula mcp api seed system].freeze

  attribute :user
  attribute :change_source, default: "system"

  # Bookkeeping for Tables::ChangeRecorder: which tables are mid-bulk-operation (so
  # per-record events are suppressed), and which already have a snapshot scheduled (so
  # one enqueue covers a whole burst of edits). Lives here to be reset automatically at
  # the end of every request and job.
  attribute :suppressed_table_ids
  attribute :scheduled_snapshot_table_ids

  # Runs the block with a different origin, restoring the previous one afterwards, so
  # nested writes (a formula triggered from the UI) are attributed to the inner source.
  def self.with_change_source(source)
    previous = change_source
    self.change_source = source.to_s
    yield
  ensure
    self.change_source = previous
  end
end
