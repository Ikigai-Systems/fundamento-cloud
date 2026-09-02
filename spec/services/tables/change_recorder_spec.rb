require "rails_helper"

RSpec.describe Tables::ChangeRecorder, type: :service do
  fixtures :organizations, :users, :organization_memberships, :spaces
  fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

  let(:table) { tables_tables(:projects) }
  let(:pawel) { users(:pawel) }
  let(:cell) { tables_cells(:projects_jira_key) }

  # A before hook, not an around one: the global Current.reset in spec/support runs as a
  # before hook and would otherwise wipe this.
  before do
    Current.user = pawel
    Current.change_source = "ui"
  end

  when_feature_disabled(:table_versioning) do
    it "records nothing" do
      expect { cell.update!(value: "CHANGED") }.not_to change { Tables::ChangeEvent.count }
    end

    it "does not schedule a snapshot" do
      expect { cell.update!(value: "CHANGED") }
        .not_to have_enqueued_job(TableVersionSnapshotJob)
    end
  end

  when_feature_enabled(:table_versioning) do
    describe "cells" do
      it "records the value change with who made it and where from" do
        expect { cell.update!(value: "CHANGED") }.to change { Tables::ChangeEvent.count }.by(1)

        event = Tables::ChangeEvent.last
        expect(event).to have_attributes(
          kind: "cell_updated",
          source: "ui",
          actor_id: pawel.id,
          table_id: table.id,
        )
        expect(event.payload).to include(
          "row_id" => cell.row_id,
          "column_id" => cell.column_id,
          "before" => "JIRA",
          "after" => "CHANGED",
        )
      end

      it "ignores a save that did not change the value" do
        expect { cell.update!(value: cell.value) }.not_to change { Tables::ChangeEvent.count }
      end

      # The rowstack grid PUTs on every keystroke, so typing a word arrives as one write
      # per character. Left alone, the log would carry an entry per keystroke and the
      # history would report six cells changed when one was.
      describe "consecutive edits to the same cell" do
        it "folds into one event spanning the whole edit" do
          expect {
            "EDITED".each_char.with_index { |_, index| cell.update!(value: "EDITED"[0..index]) }
          }.to change { Tables::ChangeEvent.where(kind: :cell_updated).count }.by(1)

          expect(Tables::ChangeEvent.last.payload).to include("before" => "JIRA", "after" => "EDITED")
        end

        it "starts a new event once another cell is touched in between" do
          cell.update!(value: "A")
          tables_cells(:projects_jira_name).update!(value: "B")
          cell.update!(value: "C")

          expect(Tables::ChangeEvent.where(kind: :cell_updated).count).to eq 3
        end

        it "starts a new event once a structural change happens in between" do
          cell.update!(value: "A")
          tables_columns(:project_name).update!(name: "Renamed")
          cell.update!(value: "C")

          expect(Tables::ChangeEvent.where(kind: :cell_updated).count).to eq 2
        end

        it "does not fold another person's edit into the first person's" do
          cell.update!(value: "A")
          Current.user = users(:stefan)
          cell.update!(value: "B")

          expect(Tables::ChangeEvent.where(kind: :cell_updated).pluck(:actor_id))
            .to contain_exactly(pawel.id, users(:stefan).id)
        end

        it "does not fold across a version boundary" do
          cell.update!(value: "A")
          Tables::VersionSnapshotService.new(table).call

          expect { cell.update!(value: "B") }
            .to change { Tables::ChangeEvent.where(kind: :cell_updated).count }.by(1)
        end
      end

      it "ignores empty cells created alongside a new row or column" do
        row = table.rows.create!(organization: table.organization, previous_row: table.rows_in_order.last)

        expect {
          row.cells.create!(table: table, column: table.columns.first, organization: table.organization, value: nil)
        }.not_to change { Tables::ChangeEvent.where(kind: :cell_updated).count }
      end
    end

    describe "rows" do
      it "records an insert" do
        expect { table.add_row }.to change { Tables::ChangeEvent.where(kind: :row_inserted).count }.by(1)
      end

      # Between two snapshots this event is the only place the deleted values survive.
      it "records a delete together with the values it destroyed" do
        row = tables_rows(:projects_row_3)

        expect { row.destroy }.to change { Tables::ChangeEvent.where(kind: :row_deleted).count }.by(1)

        payload = Tables::ChangeEvent.where(kind: :row_deleted).last.payload
        expect(payload["row_id"]).to eq row.id
        expect(payload["values"].values).to include("MON", "Monday")
      end
    end

    describe "columns" do
      let(:column) { tables_columns(:project_name) }

      it "records a rename" do
        column.update!(name: "Title")

        event = Tables::ChangeEvent.where(kind: :column_renamed).last
        expect(event.payload).to include("before" => "Name", "after" => "Title")
      end

      it "records a retype and a rename separately when both change in one save" do
        column.update!(name: "Title", kind: :long_text)

        expect(Tables::ChangeEvent.where(kind: [:column_renamed, :column_retyped]).count).to eq 2
      end

      it "records an add and a remove" do
        added = table.columns.create!(
          organization: table.organization,
          previous_column: table.columns_in_order.last,
          name: "Notes",
          kind: :string,
        )
        expect(Tables::ChangeEvent.where(kind: :column_added).last.payload).to include("name" => "Notes")

        added.destroy
        expect(Tables::ChangeEvent.where(kind: :column_removed).last.payload).to include("name" => "Notes")
      end

      it "records a move" do
        expect { tables_columns(:project_name).move_left }
          .to change { Tables::ChangeEvent.where(kind: :column_moved).count }.by_at_least(1)
      end
    end

    describe ".bulk" do
      it "collapses the whole operation into a single event" do
        expect {
          described_class.bulk(table, kind: :bulk_imported, payload: { rows: 2 }) do
            table.add_row
            table.add_row
          end
        }.to change { Tables::ChangeEvent.count }.by(1)

        expect(Tables::ChangeEvent.last).to have_attributes(kind: "bulk_imported")
        expect(Tables::ChangeEvent.last.payload).to include("rows" => 2)
      end

      it "reads the payload after the block, so callers can fill in counts they discover" do
        summary = {}

        described_class.bulk(table, kind: :bulk_imported, payload: summary) { summary[:rows] = 7 }

        expect(Tables::ChangeEvent.last.payload).to include("rows" => 7)
      end

      it "records nothing when the block raises" do
        expect {
          begin
            described_class.bulk(table, kind: :bulk_imported) { raise "boom" }
          rescue RuntimeError
            nil
          end
        }.not_to change { Tables::ChangeEvent.count }
      end

      it "stops suppressing once the block returns" do
        described_class.bulk(table, kind: :bulk_imported) { table.add_row }

        expect { cell.update!(value: "AFTER") }.to change { Tables::ChangeEvent.where(kind: :cell_updated).count }.by(1)
      end
    end

    it "writes the event in the caller's transaction, so it cannot outlive a rollback" do
      expect {
        Table.transaction do
          cell.update!(value: "CHANGED")
          raise ActiveRecord::Rollback
        end
      }.not_to change { Tables::ChangeEvent.count }
    end

    # A rolled back transaction must not mark the table as already scheduled, or the next
    # successful edit in the same request would silently never be snapshotted.
    it "still schedules a snapshot after an earlier transaction rolled back" do
      Table.transaction do
        cell.update!(value: "ROLLED BACK")
        raise ActiveRecord::Rollback
      end

      expect { cell.update!(value: "KEPT") }.to have_enqueued_job(TableVersionSnapshotJob)
    end

    it "schedules one snapshot per transaction, not one per change" do
      expect {
        Table.transaction do
          table.cells.limit(3).each_with_index { |c, i| c.update!(value: "v#{i}") }
        end
      }.to have_enqueued_job(TableVersionSnapshotJob).exactly(:once)
    end
  end
end
