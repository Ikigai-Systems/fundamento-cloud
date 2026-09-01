# frozen_string_literal: true
require "rails_helper"

RSpec.describe Icon do
  describe ".split_leading" do
    # Every one of these was mishandled by the hand-rolled codepoint ranges this
    # class replaces, so they are the point of the table rather than padding.
    #
    # The old regex was /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F191}-\u{1F251}]/,
    # which missed anything outside those three blocks and happily matched
    # dingbats that are not emoji at all.
    previously_missed = {
      "⭐ Favourites" => ["⭐", "Favourites"],
      "⏰ Reminders" => ["⏰", "Reminders"],
      "⌛ Waiting" => ["⌛", "Waiting"],
      "⬛ Blocked" => ["⬛", "Blocked"],
      "▶️ Run" => ["▶️", "Run"],
      "🀄 Game" => ["🀄", "Game"],
      "1️⃣ Step one" => ["1️⃣", "Step one"],
      "‼️ Urgent" => ["‼️", "Urgent"],
      "©️ Legal" => ["©️", "Legal"],
      "🅰️ Plan A" => ["🅰️", "Plan A"],
      "ℹ️ Info" => ["ℹ️", "Info"]
    }

    # Matched before and still matched -- guards against regressing the cases the
    # old implementation did get right.
    previously_matched = {
      "🔥 Hot Topic" => ["🔥", "Hot Topic"],
      "✅ Done" => ["✅", "Done"],
      "⚠️ Risks" => ["⚠️", "Risks"],
      "❤️ Loved" => ["❤️", "Loved"],
      "🇺🇸 United States" => ["🇺🇸", "United States"],
      "👋🏽 Hello" => ["👋🏽", "Hello"],
      "👨‍💻 Engineering" => ["👨‍💻", "Engineering"]
    }

    # Not emoji. The old regex treated all of these as icons and silently ate
    # them out of the title.
    previously_false_positives = ["✓ Reviewed", "✎ Notes", "✂ Cut", "☙ Ornament", "♀ Women"]

    # Real shapes taken from the production title survey.
    production_shapes = {
      "📆2025 planning" => ["📆", "2025 planning"],
      "✅Tagi" => ["✅", "Tagi"]
    }

    describe "emoji the previous implementation failed to recognize" do
      previously_missed.each do |input, (emoji, rest)|
        it "splits #{input.inspect}" do
          expect(described_class.split_leading(input)).to eq([emoji, rest])
        end
      end
    end

    describe "emoji the previous implementation already recognized" do
      previously_matched.each do |input, (emoji, rest)|
        it "splits #{input.inspect}" do
          expect(described_class.split_leading(input)).to eq([emoji, rest])
        end
      end
    end

    describe "symbols that are not emoji" do
      previously_false_positives.each do |input|
        it "leaves #{input.inspect} untouched" do
          expect(described_class.split_leading(input)).to be_nil
        end
      end
    end

    describe "titles seen in production" do
      production_shapes.each do |input, (emoji, rest)|
        it "splits #{input.inspect}" do
          expect(described_class.split_leading(input)).to eq([emoji, rest])
        end
      end

      # 37 of the 63 production titles starting with a symbol begin with one of
      # these, and none of them should become an icon.
      ['"/" quoted', "[Dark] mode", ".obsidian", "- dash"].each do |input|
        it "leaves #{input.inspect} untouched" do
          expect(described_class.split_leading(input)).to be_nil
        end
      end
    end

    describe "separator handling" do
      it "consumes multiple spaces" do
        expect(described_class.split_leading("📊   Dashboard")).to eq(["📊", "Dashboard"])
      end

      it "consumes a tab" do
        expect(described_class.split_leading("🎉\tCelebration")).to eq(["🎉", "Celebration"])
      end

      it "requires no separator at all" do
        expect(described_class.split_leading("📊Dashboard")).to eq(["📊", "Dashboard"])
      end

      it "leaves trailing whitespace inside the remainder alone" do
        expect(described_class.split_leading("🔥 Hot Topic ")).to eq(["🔥", "Hot Topic "])
      end
    end

    describe "an emoji with nothing after it" do
      it "returns an empty remainder" do
        expect(described_class.split_leading("🔥")).to eq(["🔥", ""])
      end

      it "returns an empty remainder when only whitespace follows" do
        expect(described_class.split_leading("🔥  ")).to eq(["🔥", ""])
      end
    end

    describe "strings with no leading emoji" do
      it "returns nil for a plain title" do
        expect(described_class.split_leading("Hot Topic")).to be_nil
      end

      it "returns nil when the emoji is not first" do
        expect(described_class.split_leading("Hot 🔥 Topic")).to be_nil
      end

      it "returns nil for nil" do
        expect(described_class.split_leading(nil)).to be_nil
      end

      it "returns nil for an empty string" do
        expect(described_class.split_leading("")).to be_nil
      end

      it "returns nil for whitespace only" do
        expect(described_class.split_leading("   ")).to be_nil
      end
    end
  end

  describe ".emoji" do
    it "builds an emoji icon" do
      icon = described_class.emoji("🔥")

      expect(icon.type).to eq("emoji")
      expect(icon.value).to eq("🔥")
      expect(icon).to be_emoji
    end
  end

  describe ".from_columns" do
    it "builds an icon from persisted columns" do
      expect(described_class.from_columns("emoji", "🔥")).to eq(described_class.emoji("🔥"))
    end

    it "returns nil when the type is missing" do
      expect(described_class.from_columns(nil, "🔥")).to be_nil
    end

    it "returns nil when the value is missing" do
      expect(described_class.from_columns("emoji", nil)).to be_nil
    end

    it "returns nil when the value is blank" do
      expect(described_class.from_columns("emoji", "")).to be_nil
    end
  end

  describe "#as_json" do
    # This is what reaches React props, the sidebar payload and the API, so the
    # key names are part of the contract.
    it "serializes to a type/value pair" do
      expect(described_class.emoji("🔥").as_json).to eq({type: "emoji", value: "🔥"})
    end
  end

  describe "#to_s" do
    it "returns the value" do
      expect(described_class.emoji("🔥").to_s).to eq("🔥")
    end
  end

  describe "equality" do
    it "is equal to an icon with the same type and value" do
      expect(described_class.emoji("🔥")).to eq(described_class.emoji("🔥"))
    end

    it "differs when the value differs" do
      expect(described_class.emoji("🔥")).not_to eq(described_class.emoji("⭐"))
    end

    it "is not equal to a bare string" do
      expect(described_class.emoji("🔥")).not_to eq("🔥")
    end

    it "hashes equal icons together" do
      expect([described_class.emoji("🔥"), described_class.emoji("🔥")].uniq.size).to eq(1)
    end
  end
end
