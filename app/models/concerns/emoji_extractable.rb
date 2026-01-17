# frozen_string_literal: true

module EmojiExtractable
  extend ActiveSupport::Concern

  class_methods do
    # Define emoji extraction methods for a given attribute
    #
    # Example:
    #   class Document < ApplicationRecord
    #     include EmojiExtractable
    #     extracts_emoji_from :title
    #   end
    #
    #   doc = Document.new(title: "🔥 Hot Topic")
    #   doc.title_emoji      # => "🔥"
    #   doc.title_emojiless  # => "Hot Topic"
    def extracts_emoji_from(method_name)
      define_method "#{method_name}_emoji" do
        extract_emoji_from_string(public_send(method_name))
      end

      define_method "#{method_name}_emojiless" do
        remove_emoji_from_string(public_send(method_name))
      end
    end
  end

  private

  # Extract emoji from the beginning of a string
  # Returns the emoji if found, otherwise nil
  def extract_emoji_from_string(string)
    return nil unless string.present?

    # Extract first grapheme cluster (handles complex emojis with modifiers)
    first_grapheme = string.scan(/\X/).first
    return nil unless first_grapheme

    # Check if it contains emoji characters (covers most common emoji ranges)
    # Extended range: 1F300-1FAFF includes newer emojis like 🪲 (U+1FAB2) from Unicode 13.0
    # Combined ranges to avoid overlaps: 1F300-1FAFF covers 1F600-1F64F and 1F680-1F6FF
    if first_grapheme.match?(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F191}-\u{1F251}]/)
      first_grapheme
    else
      nil
    end
  end

  # Remove emoji and any following whitespace from the beginning of a string
  # Returns the string without the leading emoji, or the original string if no emoji found
  def remove_emoji_from_string(string)
    return string unless string.present?

    emoji = extract_emoji_from_string(string)
    return string unless emoji

    # Remove the emoji and any following whitespace
    string.sub(/\A#{Regexp.escape(emoji)}\s*/, "")
  end
end
