# Appends to a table's change log and schedules the snapshot that will roll those
# changes into a version.
#
# Recording is hooked at the model layer rather than the controller layer on purpose:
# there are at least eight write paths into table content (rowstack, the cells
# controller, CSV import, Table#add_row, the four Formula::ActionExecutor methods
# reachable from formulas, buttons, automations and the MCP tools, column moves, and the
# seeds). Instrumenting each by hand guarantees a missed one; all of them go through
# ActiveRecord.
module Tables
  class ChangeRecorder
    # The rowstack grid issues one request per keystroke, so typing a word into a cell
    # arrives as one change event per character. Consecutive edits by the same person to
    # the same cell inside this window are folded into the event already there.
    COALESCE_WINDOW = 30.seconds

    class << self
      # Appends one event. Runs inside the caller's transaction, so an event never
      # survives a mutation that rolled back.
      def record(table:, organization_id:, kind:, payload: {})
        return if suppressed?(table)

        if (previous = coalescable_event(table, kind, payload))
          # Keep the original "before": the interesting change is from what the cell held
          # when the person started typing to what it holds now, not the last keystroke.
          previous.update_columns(
            payload: previous.payload.merge("after" => payload[:after]),
            created_at: Time.current,
          )
        else
          Tables::ChangeEvent.create!(
            table_id: table.id,
            organization_id: organization_id,
            actor_id: Current.user&.id,
            source: Current.change_source,
            kind: kind,
            payload: payload,
          )
        end

        schedule_snapshot(table)
      end

      # Collapses a wholesale rewrite (CSV import, restore, seeding) into a single event.
      # A 10,000-row import must not write 10,000 events, and the per-record before/after
      # values are meaningless when the whole table is being replaced anyway.
      def bulk(table, kind:, payload: {})
        return yield if suppressed?(table)

        suppressed_table_ids << table.id
        result =
          begin
            yield
          ensure
            suppressed_table_ids.delete(table.id)
          end

        record(table: table, organization_id: table.organization_id, kind: kind, payload: payload)

        result
      end

      def suppressed?(table)
        suppressed_table_ids.include?(table.id)
      end

      private

      # Strictly the immediately preceding event, so anything happening in between -- a
      # column rename, an edit to another cell -- ends the run and keeps the log in order.
      def coalescable_event(table, kind, payload)
        return nil unless kind.to_s == "cell_updated"

        previous = Tables::ChangeEvent.where(table_id: table.id, version_id: nil).order(id: :desc).first

        return nil if previous.nil?
        return nil unless previous.cell_updated?
        return nil unless previous.actor_id == Current.user&.id
        return nil unless previous.source == Current.change_source
        return nil if previous.created_at < COALESCE_WINDOW.ago
        return nil unless previous.payload["row_id"] == payload[:row_id]
        return nil unless previous.payload["column_id"] == payload[:column_id]

        previous
      end

      def suppressed_table_ids
        Tables::RecordingState.suppressed_table_ids ||= Set.new
      end

      # One enqueue per table per unit of work, rather than one per event: a 50-cell paste
      # would otherwise make 50 enqueue attempts for GoodJob's enqueue_limit to reject.
      #
      # The de-duplication happens inside the callback, not before it, so that a rolled
      # back transaction leaves nothing behind. Marking the table as scheduled up front
      # would strand it: the callback never runs on rollback, and the next successful
      # edit in the same request would then be dropped on the floor.
      def schedule_snapshot(table)
        ActiveRecord.after_all_transactions_commit do
          scheduled = (Tables::RecordingState.scheduled_snapshot_table_ids ||= Set.new)

          if scheduled.add?(table.id)
            TableVersionSnapshotJob.set(wait: TableVersionSnapshotJob::WINDOW).perform_later(table)
          end
        end
      end
    end
  end
end
