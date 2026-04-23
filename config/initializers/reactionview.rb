# frozen_string_literal: true

ReActionView.configure do |config|
  # Intercept .html.erb templates and process them with `Herb::Engine` for enhanced features
  config.intercept_erb = true

  # Enable debug mode in development (adds debug attributes to HTML)
  config.debug_mode = Rails.env.development?

  # Validation mode (:raise, :overlay, or :none) — defaults to :raise in test, :overlay otherwise
  # config.validation_mode = :overlay

  # Add custom transform visitors to process templates before compilation
  # config.transform_visitors = [
  #   Herb::Visitor::new
  # ]
end

# HACK: Only intercept local (app) templates with Herb, fall back to standard ERB for gem templates.
# Gem templates may contain HTML that Herb flags as invalid but we can't fix.
# Remove once reactionview >= 0.4 ships with this fix built-in.
# See: https://github.com/marcoroth/reactionview/issues/91
# See: https://github.com/marcoroth/reactionview/pull/94
ReActionView::Template::Handlers::ERB.prepend(Module.new do
  def call(template, source)
    if intercept_template?(template)
      ::ReActionView::Template::Handlers::Herb.call(template, source)
    else
      # bypass Herb entirely — use the original ActionView ERB handler
      ActionView::Template::Handlers::ERB.instance_method(:call).bind_call(self, template, source)
    end
  end

  private

  def intercept_template?(template)
    template.format == :html && ReActionView.config.intercept_erb && local_template?(template)
  end

  def local_template?(template)
    return true unless template.respond_to?(:identifier) && template.identifier

    template.identifier.start_with?(Rails.root.to_s)
  end
end)
