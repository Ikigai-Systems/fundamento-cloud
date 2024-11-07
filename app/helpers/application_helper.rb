module ApplicationHelper
  def link_to_with_disable(name = nil, options = nil, html_options = nil, &block)
    if html_options.is_a?(Hash) && html_options[:disabled]
      content_tag(:span, name, html_options)
    else
      link_to(name, options, html_options, &block)
    end
  end
end