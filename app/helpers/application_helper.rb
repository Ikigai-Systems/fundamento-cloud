module ApplicationHelper
  def link_to_with_disable(name = nil, options = nil, html_options = nil, &block)
    if (block_given? ? options : html_options).is_a?(Hash) && (block_given? ? options : html_options)[:disabled]
      content_tag(:span, name, (block_given? ? options : html_options), &block)
    else
      link_to(name, options, html_options, &block)
    end
  end

  def database_id
    DatabaseId.get(ActiveRecord::Base.connection)
  end
end