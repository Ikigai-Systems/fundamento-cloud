# frozen_string_literal: true
require "rails_helper"

RSpec.describe EmojiExtractable do
  # Create a test controller that includes the concern
  let(:test_class) do
    Class.new(ApplicationController) do
      include ActiveModel::Model
      include EmojiExtractable

      attr_accessor :title, :name

      extracts_emoji_from :title
      extracts_emoji_from :name
    end
  end

  let(:model) { test_class.new }

  describe "{method}_emoji" do
    context "when string starts with an emoji" do
      it "extracts simple emoji" do
        model.title = "🔥 Hot Topic"
        expect(model.title_emoji).to eq("🔥")
      end

      it "extracts emoji without whitespace" do
        model.title = "📊Dashboard"
        expect(model.title_emoji).to eq("📊")
      end

      it "extracts emoji from different attributes" do
        model.name = "🎉 Celebration"
        expect(model.name_emoji).to eq("🎉")
      end

      it "extracts complex emoji with skin tone modifier" do
        model.title = "👋🏽 Hello"
        expect(model.title_emoji).to eq("👋🏽")
      end

      it "extracts flag emoji" do
        model.title = "🇺🇸 United States"
        expect(model.title_emoji).to eq("🇺🇸")
      end

      it "extracts emoji with variation selector" do
        model.title = "✨ Sparkles"
        expect(model.title_emoji).to eq("✨")
      end

      it "extracts only first emoji when multiple present" do
        model.title = "🔥🎉 Party"
        expect(model.title_emoji).to eq("🔥")
      end
    end

    context "when string starts with unusual or extended Unicode emojis" do
      it "extracts beetle emoji from Unicode 13.0 Extended-A block (U+1FAB2)" do
        model.title = "🪲 Bug Report"
        expect(model.title_emoji).to eq("🪲")
      end

      it "extracts anatomical heart emoji (U+1FAC0)" do
        model.title = "🫀 Heartbeat"
        expect(model.title_emoji).to eq("🫀")
      end

      it "extracts wood emoji (U+1FAB5)" do
        model.title = "🪵 Lumber"
        expect(model.title_emoji).to eq("🪵")
      end

      it "extracts saluting face emoji (U+1FAE1)" do
        model.title = "🫡 Salute"
        expect(model.title_emoji).to eq("🫡")
      end

      it "extracts face holding back tears emoji (U+1F979)" do
        model.title = "🥹 Emotional"
        expect(model.title_emoji).to eq("🥹")
      end

      it "extracts heart hands emoji (U+1FAF6)" do
        model.title = "🫶 Love"
        expect(model.title_emoji).to eq("🫶")
      end

      it "extracts melting face emoji (U+1FAE0)" do
        model.title = "🫠 Melting"
        expect(model.title_emoji).to eq("🫠")
      end

      it "extracts rock emoji (U+1FAA8)" do
        model.title = "🪨 Stone"
        expect(model.title_emoji).to eq("🪨")
      end

      it "extracts lotus emoji (U+1FAB7)" do
        model.title = "🪷 Lotus"
        expect(model.title_emoji).to eq("🪷")
      end

      it "extracts coin emoji (U+1FA99)" do
        model.title = "🪙 Coin"
        expect(model.title_emoji).to eq("🪙")
      end
    end

    context "when string does not start with an emoji" do
      it "returns nil for regular text" do
        model.title = "Regular Title"
        expect(model.title_emoji).to be_nil
      end

      it "returns nil for text with emoji later" do
        model.title = "Hello 🔥"
        expect(model.title_emoji).to be_nil
      end

      it "returns nil for numbers" do
        model.title = "123 Numbers"
        expect(model.title_emoji).to be_nil
      end

      it "returns nil for special characters" do
        model.title = "* Special"
        expect(model.title_emoji).to be_nil
      end
    end

    context "when string is empty or nil" do
      it "returns nil for empty string" do
        model.title = ""
        expect(model.title_emoji).to be_nil
      end

      it "returns nil for nil value" do
        model.title = nil
        expect(model.title_emoji).to be_nil
      end

      it "returns nil for whitespace only" do
        model.title = "   "
        expect(model.title_emoji).to be_nil
      end
    end
  end

  describe "{method}_emojiless" do
    context "when string starts with an emoji" do
      it "removes emoji and following whitespace" do
        model.title = "🔥 Hot Topic"
        expect(model.title_emojiless).to eq("Hot Topic")
      end

      it "removes emoji with multiple spaces" do
        model.title = "📊   Dashboard"
        expect(model.title_emojiless).to eq("Dashboard")
      end

      it "removes emoji with tab" do
        model.title = "🎉\tCelebration"
        expect(model.title_emojiless).to eq("Celebration")
      end

      it "removes emoji without whitespace" do
        model.title = "📊Dashboard"
        expect(model.title_emojiless).to eq("Dashboard")
      end

      it "removes complex emoji with skin tone" do
        model.title = "👋🏽 Hello"
        expect(model.title_emojiless).to eq("Hello")
      end

      it "removes flag emoji" do
        model.title = "🇺🇸 United States"
        expect(model.title_emojiless).to eq("United States")
      end

      it "removes only first emoji" do
        model.title = "🔥 Hot 🎉 Party"
        expect(model.title_emojiless).to eq("Hot 🎉 Party")
      end

      it "preserves emoji later in string" do
        model.title = "🔥 Fire emoji 🔥"
        expect(model.title_emojiless).to eq("Fire emoji 🔥")
      end

      it "works with different attributes" do
        model.name = "🎉 Celebration"
        expect(model.name_emojiless).to eq("Celebration")
      end
    end

    context "when string starts with unusual or extended Unicode emojis" do
      it "removes beetle emoji (U+1FAB2)" do
        model.title = "🪲 Bug Report"
        expect(model.title_emojiless).to eq("Bug Report")
      end

      it "removes anatomical heart emoji (U+1FAC0)" do
        model.title = "🫀 Heartbeat"
        expect(model.title_emojiless).to eq("Heartbeat")
      end

      it "removes wood emoji (U+1FAB5)" do
        model.title = "🪵 Lumber"
        expect(model.title_emojiless).to eq("Lumber")
      end

      it "removes saluting face emoji (U+1FAE1)" do
        model.title = "🫡 Salute"
        expect(model.title_emojiless).to eq("Salute")
      end

      it "removes face holding back tears emoji (U+1F979)" do
        model.title = "🥹 Emotional"
        expect(model.title_emojiless).to eq("Emotional")
      end

      it "removes heart hands emoji (U+1FAF6)" do
        model.title = "🫶 Love"
        expect(model.title_emojiless).to eq("Love")
      end

      it "removes melting face emoji (U+1FAE0)" do
        model.title = "🫠 Melting"
        expect(model.title_emojiless).to eq("Melting")
      end

      it "removes rock emoji (U+1FAA8)" do
        model.title = "🪨 Stone"
        expect(model.title_emojiless).to eq("Stone")
      end

      it "removes lotus emoji (U+1FAB7)" do
        model.title = "🪷 Lotus"
        expect(model.title_emojiless).to eq("Lotus")
      end

      it "removes coin emoji (U+1FA99)" do
        model.title = "🪙 Coin"
        expect(model.title_emojiless).to eq("Coin")
      end
    end

    context "when string does not start with an emoji" do
      it "returns original string" do
        model.title = "Regular Title"
        expect(model.title_emojiless).to eq("Regular Title")
      end

      it "preserves emoji not at start" do
        model.title = "Hello 🔥"
        expect(model.title_emojiless).to eq("Hello 🔥")
      end

      it "preserves numbers" do
        model.title = "123 Numbers"
        expect(model.title_emojiless).to eq("123 Numbers")
      end
    end

    context "when string is empty or nil" do
      it "returns empty string for empty string" do
        model.title = ""
        expect(model.title_emojiless).to eq("")
      end

      it "returns nil for nil value" do
        model.title = nil
        expect(model.title_emojiless).to be_nil
      end

      it "returns original for whitespace only" do
        model.title = "   "
        expect(model.title_emojiless).to eq("   ")
      end
    end

    context "when string is only an emoji" do
      it "returns empty string" do
        model.title = "🔥"
        expect(model.title_emojiless).to eq("")
      end

      it "returns empty string for emoji with trailing whitespace" do
        model.title = "🔥  "
        expect(model.title_emojiless).to eq("")
      end
    end
  end
end
