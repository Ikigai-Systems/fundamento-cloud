# Attributes that underline a title in its object's colour (see color_label.css).
#
# Accepts anything responding to +color+ (a Document or a Table), or the colour name
# itself as a String/Symbol, or nil. Structs such as a mention expose the colour as
# +object_color+ / +referenced_color+: pass that value. In a ViewComponent call it as
# +helpers.color_label_attributes(...)+.
#
#   <span <%= tag.attributes(color_label_attributes(document)) %>>Title</span>
#   tag.span(title, **color_label_attributes(table))
module ColorLabelHelper
  def color_label_attributes(object)
    name = object.respond_to?(:color) ? object.color : object
    return {} if name.blank?

    {class: "color-label", data: {color: name.to_s}}
  end
end
