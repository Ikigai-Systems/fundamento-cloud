# frozen_string_literal: true

MCP.configure do |config|
  config.exception_reporter = ->(exception, context) {
    Sentry.capture_exception(exception, extra: context)
  }

  # Exposes the server_context (user_id, organization_id) to around_request.
  config.instrument_server_context = true

  config.around_request = ->(data, &request_handler) {
    context = data[:server_context] || {}
    Sentry.set_user(id: context[:user_id]) if context[:user_id]
    Sentry.set_tags(organization_id: context[:organization_id]) if context[:organization_id]

    # The block's value is the response, so it must end with the handler's result.
    Sentry.with_child_span(op: "mcp.request", description: data[:method].to_s) do |span|
      result = request_handler.call
      span&.set_data("mcp.tool", data[:tool_name]) if data[:tool_name]
      result
    end
  }
end
