# frozen_string_literal: true

# The Color row of the Details tab. People who can edit get a radiogroup of swatches that saves
# on choice (color_picker_controller.ts); everyone else sees the current color's name.
class SidebarColorField < ViewComponent::Base
  def initialize(object:, editable:)
    @object = object
    @editable = editable
  end

  def editable?
    @editable
  end

  def color
    @object.color
  end

  # "document" or "table": picks the generated API client in the controller.
  def object_type
    @object.class.model_name.singular
  end

  def color_name
    color&.capitalize || "None"
  end

  def name_attributes
    helpers.color_label_attributes(color)
  end

  def controller_data
    return {} unless editable?

    {controller: "color-picker", color_picker_type_value: object_type, color_picker_id_value: @object.id, color_picker_color_value: color.to_s}
  end
end
