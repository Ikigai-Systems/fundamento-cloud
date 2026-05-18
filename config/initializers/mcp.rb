# frozen_string_literal: true

MCP.configure do |config|
  config.exception_reporter = ->(exception, context) {
    Sentry.capture_exception(exception, extra: context)
  }

  config.around_request = ->(data, &request_handler) {
    Sentry.with_child_span(op: "mcp.request", description: data[:method].to_s) do
      request_handler.call
    end
  }
end
