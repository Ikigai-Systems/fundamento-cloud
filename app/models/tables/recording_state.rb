# Bookkeeping for Tables::ChangeRecorder within one unit of work: which tables are
# mid-bulk-operation (so per-record events are suppressed), and which already have a
# snapshot scheduled (so one enqueue covers a whole burst of edits).
#
# Kept out of Current, which is for identity. Being a CurrentAttributes class means this
# is reset at the end of every request and job, so a suppression flag can never leak into
# unrelated work and silently stop recording.
module Tables
  class RecordingState < ActiveSupport::CurrentAttributes
    attribute :suppressed_table_ids
    attribute :scheduled_snapshot_table_ids
  end
end
