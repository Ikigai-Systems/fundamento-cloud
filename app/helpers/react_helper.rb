module ReactHelper
  def react_component(component_name, propsAutoConvertedToCamelCase = {}, propsNoConversion = {}, **args)
    content_tag(:div, "", data: {
      controller: "react-loader",
      react_loader_component_value: component_name,
      react_loader_props_auto_converted_to_camel_case_value: propsAutoConvertedToCamelCase,
      react_loader_props_no_conversion_value: propsNoConversion,
    }, **args)
  end
end