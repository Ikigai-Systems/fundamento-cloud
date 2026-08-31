# frozen_string_literal: true

# Persists a leading emoji typed into a title as a first-class icon.
#
#   class Document < ApplicationRecord
#     include HasIcon
#     has_icon derived_from: :title
#   end
#
#   document.update!(title: "🔥 Hot Topic")
#   document.title              # => "Hot Topic"
#   document.icon              # => #<Icon emoji "🔥">
#   document.title_for_editing # => "🔥 Hot Topic"
#
# This replaces EmojiExtractable, which answered "does this title start with an
# emoji?" on every read. Doing it once on write means every reader -- ERB,
# serializers, the sidebar payload, React -- just reads two clean fields, and no
# other language ever needs its own emoji matcher.
#
# The title is still the only editing surface for the icon, so promotion stays a
# pure function of what the user typed: a leading emoji becomes the icon, and no
# leading emoji means no icon. Once a real picker exists the edit surface
# changes and this flips to icon-authoritative.
module HasIcon
  extend ActiveSupport::Concern

  class_methods do
    # `derived_from` must be the real column. Table#title and Space#title are
    # read-only aliases for `name`, with no matching writer.
    def has_icon(derived_from:)
      class_attribute :icon_source_attribute, instance_writer: false, default: derived_from

      # Promotion has to run when the user *submits* a title, which is not the
      # same as the title *changing*. Removing the emoji from the edit field
      # submits "Roadmap" while "Roadmap" is already stored -- dirty tracking
      # calls that no change, so a will_save_change_to guard would make the icon
      # impossible to remove. Overriding the writer records the assignment
      # itself, which also means an unrelated `update!(archived: true)` never
      # touches the icon.
      define_method("#{derived_from}=") do |value|
        @icon_source_assigned = true
        super(value)
      end

      before_validation :promote_leading_emoji_to_icon, if: -> { @icon_source_assigned }
    end
  end

  def icon
    Icon.from_columns(icon_type, icon_value)
  end

  # The combined string an edit field should show. The stored title has the
  # emoji stripped out, so binding an input straight to it would hide the icon
  # from the user and then clear it when they saved.
  def title_for_editing
    [icon_value, read_attribute(self.class.icon_source_attribute).presence].compact.join(" ")
  end

  # What a JSON response must carry after a save so the client can update a
  # renamed row in place. The server has already decided what is title and what
  # is icon; sending both means no other language has to work it out again.
  def icon_attributes_for_json
    {"icon" => icon, "title_for_editing" => title_for_editing}
  end

  private

  def promote_leading_emoji_to_icon
    attribute = self.class.icon_source_attribute
    emoji, rest = Icon.split_leading(read_attribute(attribute))

    # An emoji-only title strips to "", which Table and Space reject outright
    # and which would leave a Document reading "Untitled". Leave those alone.
    if emoji && rest.present?
      # write_attribute rather than the writer above, so this does not re-arm
      # the flag we are about to clear.
      write_attribute(attribute, rest)
      self.icon_type = Icon::EMOJI
      self.icon_value = emoji
    else
      self.icon_type = nil
      self.icon_value = nil
    end

    # One-shot: the next save only promotes again if the title is reassigned.
    @icon_source_assigned = false
  end
end
