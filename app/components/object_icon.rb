class ObjectIcon < ViewComponent::Base
  # Both branches share one fixed-width slot. Emoji glyphs are wider than the
  # icon font's, so without it the labels in a list step sideways depending on
  # whether an object happens to have an icon.
  erb_template <<-ERB
    <% if slot? %>
      <span class="object-icon" data-fallback-icon="<%= fallback_icon_class %>"><% if @icon %><%= @icon %><% else %><i class="<%= fallback_icon_class %>"></i><% end %></span>
    <% end %>
  ERB

  FALLBACK_ICON_CLASSES = {
    "Document" => "fa-regular fa-file-lines",
    "Table" => "fa-regular fa-table",
    "Space" => "fa-sharp fa-regular fa-space-station-moon"
  }.freeze

  # Pass `object` for a record, or `type` alone for a section header that has no
  # particular record behind it. `icon` is only needed where the record itself is
  # not to hand -- mentions and references carry the icon on their struct.
  def initialize(object: nil, type: nil, icon: nil)
    @type = (type || object&.class).to_s
    @icon = icon || (object&.respond_to?(:icon) ? object.icon : nil)

    assert @type.present?, "You need to pass object or type"
  end

  # Travels with the rendered icon so the client can put the default glyph back
  # when an icon is removed, without having to know which glyph belongs to which
  # type. See app/javascript/sidebar/object_icon.ts.
  def fallback_icon_class
    FALLBACK_ICON_CLASSES[@type]
  end

  private

  # An unrecognised type with no icon has nothing to draw, as before.
  def slot?
    @icon.present? || fallback_icon_class.present?
  end
end
