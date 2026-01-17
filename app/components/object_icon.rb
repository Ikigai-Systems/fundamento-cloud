# frozen_string_literal: true

class ObjectIcon < ViewComponent::Base
  erb_template <<-ERB
    <% if @emoji.present? %>
      <%= @emoji %>
    <% elsif @type.to_s == Document.to_s %>
      <i class="fa-regular fa-file-lines"></i>
    <% elsif @type.to_s == Table.to_s %>
      <i class="fa-regular fa-table"></i>
    <% elsif @type.to_s == Space.to_s %>
      <i class="fa-sharp fa-regular fa-space-station-moon"></i>
    <% end %>
  ERB

  def initialize(object: nil, type: nil, emoji: nil)
    @type = type || object&.class&.to_s
    @emoji = emoji || (object&.respond_to?(:title_emoji) ? object.title_emoji : nil)

    assert @type.present?, "You need to pass object or type"
  end
end
