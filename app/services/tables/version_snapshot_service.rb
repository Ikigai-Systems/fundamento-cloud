# Rolls a table's unlinked change events into one version: builds a snapshot of the
# current state, records it, and claims the events that led to it.
#
# Claiming mirrors how Documents::VersionsController claims unlinked editing sessions on
# save -- the events a version owns are what its contributor list is derived from.
module Tables
  class VersionSnapshotService
    def initialize(table, kind: :auto, restored_from: nil)
      @table = table
      @kind = kind.to_s
      @restored_from = restored_from
    end

    def call
      events = table.change_events.unlinked.chronological.to_a

      # :auto only exists to describe changes. :initial deliberately runs on an untouched
      # table to establish the baseline.
      return if kind == "auto" && events.empty?

      result = Tables::SnapshotBuilder.new(table).build
      latest = table.latest_version

      # Edited and undone within one window: claim the events so they are not weighed
      # again, but keep the empty version out of the timeline.
      if latest&.content_digest == result.digest
        claim(events, latest)
        return latest
      end

      # Upload before opening the transaction: the DB work stays short and a version row
      # never exists without the blob it points at.
      blob = ActiveStorage::Blob.create_and_upload!(
        io: result.io,
        filename: "table-#{table.id}-#{result.digest.first(12)}.json.gz",
        content_type: "application/gzip",
      )

      Tables::Version.transaction do
        version = table.versions.create!(
          organization_id: table.organization_id,
          kind: kind,
          restored_from: restored_from,
          created_by: primary_actor(events),
          summary: Tables::ChangeSummary.for(events),
          row_count: result.row_count,
          column_count: result.column_count,
          content_digest: result.digest,
        )

        version.snapshot.attach(blob)
        claim(events, version)

        version
      end
    ensure
      result&.io&.close!
    end

    private

    attr_reader :table, :kind, :restored_from

    def claim(events, version)
      return if events.empty?

      Tables::ChangeEvent.where(id: events.map(&:id)).update_all(version_id: version.id)
    end

    # Whoever made most of the changes in the window is the version's author; everyone
    # else shows up as a contributor.
    def primary_actor(events)
      actor_id = events.filter_map(&:actor_id).tally.max_by { |_, count| count }&.first

      User.find_by(id: actor_id) if actor_id
    end
  end
end
