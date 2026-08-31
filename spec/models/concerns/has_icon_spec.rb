# frozen_string_literal: true
require "rails_helper"

RSpec.describe HasIcon do
  fixtures :organizations, :spaces, :documents

  let(:organization) { organizations(:hc) }
  let(:space) { spaces(:hc_default) }

  def new_document(title)
    Document.new(title: title, organization: organization, space: space)
  end

  def create_table(name, in_space: nil)
    in_space ||= space
    Table.create!(name: name, organization: organization, space: in_space, parent: in_space)
  end

  describe "promoting a leading emoji" do
    it "moves the emoji into the icon and strips it from the title" do
      document = new_document("🔥 Hot Topic")

      document.save!

      expect(document.title).to eq("Hot Topic")
      expect(document.icon).to eq(Icon.emoji("🔥"))
    end

    it "works for emoji the previous implementation could not recognize" do
      document = new_document("⭐ Roadmap")

      document.save!

      expect(document.title).to eq("Roadmap")
      expect(document.icon).to eq(Icon.emoji("⭐"))
    end

    it "promotes on update as well as create" do
      document = new_document("Roadmap")
      document.save!

      document.update!(title: "⭐ Roadmap")

      expect(document.title).to eq("Roadmap")
      expect(document.icon).to eq(Icon.emoji("⭐"))
    end

    it "replaces an existing icon when the leading emoji changes" do
      document = new_document("🔥 Roadmap")
      document.save!

      document.update!(title: "⭐ Roadmap")

      expect(document.icon).to eq(Icon.emoji("⭐"))
    end

    it "needs no separator between the emoji and the title" do
      document = new_document("📆2025 planning")

      document.save!

      expect(document.title).to eq("2025 planning")
      expect(document.icon).to eq(Icon.emoji("📆"))
    end
  end

  describe "clearing the icon" do
    it "clears the icon when the leading emoji is removed from the title" do
      document = new_document("🔥 Roadmap")
      document.save!

      document.update!(title: "Roadmap")

      expect(document.icon).to be_nil
      expect(document.title).to eq("Roadmap")
    end

    # The regression this guard exists for: without the will_save_change_to
    # condition, any unrelated save re-runs the promotion against a title that
    # no longer contains the emoji, and silently wipes the icon.
    it "does not clear the icon on a save that leaves the title alone" do
      document = new_document("🔥 Roadmap")
      document.save!

      document.update!(archived: true)

      expect(document.reload.icon).to eq(Icon.emoji("🔥"))
    end

    # The assignment flag is one-shot; if it stuck around, the next unrelated
    # save would re-run promotion against the already-stripped title.
    it "does not re-run promotion on an unrelated save after a title change" do
      document = new_document("🔥 Roadmap")
      document.save!
      document.update!(title: "⭐ Roadmap")

      document.update!(archived: true)

      expect(document.reload.icon).to eq(Icon.emoji("⭐"))
    end

    it "does not clear the icon when the record is merely reloaded and saved" do
      document = new_document("🔥 Roadmap")
      document.save!

      document.reload.save!

      expect(document.reload.icon).to eq(Icon.emoji("🔥"))
    end
  end

  describe "titles that must be left alone" do
    it "ignores a leading symbol that is not an emoji" do
      document = new_document("✓ Reviewed")

      document.save!

      expect(document.title).to eq("✓ Reviewed")
      expect(document.icon).to be_nil
    end

    it "ignores an emoji that is not at the start" do
      document = new_document("Hot 🔥 Topic")

      document.save!

      expect(document.title).to eq("Hot 🔥 Topic")
      expect(document.icon).to be_nil
    end

    # Stripping would leave an empty title, which Table and Space reject and
    # which would render a Document as "Untitled".
    it "ignores an emoji-only title" do
      document = new_document("✅")

      document.save!

      expect(document.title).to eq("✅")
      expect(document.icon).to be_nil
    end

    # Document#title returns "Untitled" for a blank title, so the callback has to
    # read the raw attribute or it would try to extract an emoji from that word.
    it "handles a nil title without inventing an icon" do
      document = new_document(nil)

      document.save!

      expect(document.title).to eq("Untitled")
      expect(document.icon).to be_nil
    end
  end

  describe "#icon" do
    it "is nil when no icon is stored" do
      expect(new_document("Roadmap").icon).to be_nil
    end

    it "serializes to a type/value pair for React props" do
      document = new_document("🔥 Roadmap")
      document.save!

      expect(document.to_react_props[:icon].as_json).to eq({type: "emoji", value: "🔥"})
    end
  end

  describe "#title_for_editing" do
    it "puts the emoji back so the edit field shows what the user typed" do
      document = new_document("🔥 Hot Topic")
      document.save!

      expect(document.title_for_editing).to eq("🔥 Hot Topic")
    end

    it "is just the title when there is no icon" do
      document = new_document("Hot Topic")
      document.save!

      expect(document.title_for_editing).to eq("Hot Topic")
    end

    it "is just the emoji when the title is blank" do
      document = new_document("Hot Topic")
      document.save!
      document.update_columns(title: nil, icon_type: "emoji", icon_value: "🔥")

      expect(document.reload.title_for_editing).to eq("🔥")
    end
  end

  describe "models whose icon derives from name rather than title" do
    it "promotes for tables" do
      table = create_table("📊 Metrics")

      expect(table.name).to eq("Metrics")
      expect(table.title).to eq("Metrics")
      expect(table.icon).to eq(Icon.emoji("📊"))
    end

    it "promotes for spaces" do
      space = Space.create!(name: "🚀 Launch", organization: organization)

      expect(space.name).to eq("Launch")
      expect(space.title).to eq("Launch")
      expect(space.icon).to eq(Icon.emoji("🚀"))
    end
  end

  describe "when stripping the emoji would duplicate an existing name" do
    # "🔥 Notes" and "Notes" really are the same name carrying different icons
    # once the emoji is an icon, so the existing uniqueness validation is the
    # right answer -- as long as it surfaces as a validation error rather than a
    # database-level explosion.
    it "fails validation instead of raising a uniqueness violation" do
      create_table("Notes")
      duplicate = Table.new(name: "🔥 Notes", organization: organization, space: space, parent: space)

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:name]).to be_present
    end

    it "still allows the same stripped name in a different space" do
      create_table("Notes", in_space: spaces(:hc_restricted))

      expect { create_table("🔥 Notes") }.not_to raise_error
    end
  end
end
