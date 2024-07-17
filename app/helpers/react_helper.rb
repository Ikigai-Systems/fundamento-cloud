module ReactHelper
  def react_component(component_name, props = {}, **args)
    content_tag(:div, "", data: {
      controller: "react-loader",
      react_loader_component_value: component_name,
      react_loader_props_value: props
    }, **args)
  end
end