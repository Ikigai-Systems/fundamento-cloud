module ApplicationHelper
  def link_to_with_disable(name = nil, options = nil, html_options = nil, &block)
    html_options, options, name = options, name, block if block_given?

    if html_options.is_a?(Hash) && html_options[:disabled]
      content_tag(:span, name, html_options, &block)
    else
      link_to(name, options, html_options, &block)
    end
  end
end