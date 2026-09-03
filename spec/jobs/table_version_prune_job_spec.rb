require "rails_helper"

RSpec.describe TableVersionPruneJob, type: :job do
  fixtures :organizations, :users, :organization_memberships, :spaces
  fixtures "tables/tables", "tables/columns", "tables/rows", "tables/cells"

  let(:table) { tables_tables(:projects) }

  def version_at(time, kind: :auto, sequential_id:)
    table.versions.create!(
      organization: table.organization,
      kind: kind,
      sequential_id: sequential_id,
      created_at: time,
      updated_at: time,
    )
  end

  # Ships inert on purpose: keep everything until a deployment has real storage numbers.
  describe "with the shipped retention policy" do
    it "refuses to be enqueued" do
      expect { described_class.perform_later(table) }.not_to have_enqueued_job(described_class)
    end

    it "prunes nothing if it somehow runs" do
      version_at(400.days.ago, sequential_id: 1)
      version_at(399.days.ago, sequential_id: 2)

      expect { described_class.perform_now(table) }.not_to change { table.versions.count }
    end
  end

  describe "with thinning turned on" do
    before { stub_const("Tables::Version::RETENTION_POLICY", :thinned) }

    it "keeps recent versions untouched" do
      version_at(1.hour.ago, sequential_id: 1)
      version_at(2.hours.ago, sequential_id: 2)

      expect { described_class.perform_now(table) }.not_to change { table.versions.count }
    end

    it "thins older versions down to the newest in each bucket" do
      base = 30.days.ago.beginning_of_day + 12.hours
      version_at(base, sequential_id: 1)
      version_at(base + 1.minute, sequential_id: 2)
      kept_newest = version_at(base + 2.minutes, sequential_id: 3)

      described_class.perform_now(table)

      expect(table.versions.reload.map(&:sequential_id)).to include(kept_newest.sequential_id)
      expect(table.versions.count).to be < 3
    end

    it "never prunes the baseline, a restore, a pinned version, or the newest one" do
      base = 200.days.ago
      baseline = version_at(base, kind: :initial, sequential_id: 1)
      restore = version_at(base + 1.minute, kind: :restore, sequential_id: 2)
      pinned = version_at(base + 2.minutes, sequential_id: 3).tap { |v| v.update!(pinned: true) }
      version_at(base + 3.minutes, sequential_id: 4)
      newest = version_at(base + 4.minutes, sequential_id: 5)

      described_class.perform_now(table)

      expect(table.versions.reload.map(&:id))
        .to include(baseline.id, restore.id, pinned.id, newest.id)
    end
  end
end
