# frozen_string_literal: true

class ApplicationTool < MCP::Tool
  # All Fundamento tools operate only within the workspace — never open-world.
  # Override annotations to inject this default so subclasses don't repeat it.
  def self.annotations(*args)
    args.empty? ? super() : super({ open_world_hint: false }.merge(args.first))
  end

  def self.call(**kwargs)
    with_text_content(perform(**kwargs))
  rescue ActiveRecord::RecordNotFound => e
    tool_error_response("not_found", not_found_message(e))
  rescue Pundit::NotAuthorizedError
    tool_error_response("unauthorized", "You are not authorized to perform this action.")
  rescue ArgumentError => e
    tool_error_response("invalid_input", e.message)
  rescue ActiveRecord::RecordInvalid => e
    tool_error_response("invalid_input", e.message)
  rescue => e
    Sentry.capture_exception(e, extra: { tool: name, kwargs: kwargs.except(:server_context) })
    tool_error_response("internal_error", "An unexpected error occurred.")
  end

  def self.pundit_user_from_context(server_context)
    user = User.find(server_context[:user_id])
    organization = user.organizations.find(server_context[:organization_id])

    PolicyUserContext.new(
      user,
      organization
    )
  end

  # A finder's message carries the SQL WHERE clause, which tells an agent nothing it can act on.
  # A RecordNotFound raised by hand has no model and keeps its own message.
  def self.not_found_message(error)
    return error.message if error.model.nil?

    ids = Array(error.id).join(", ")
    ["#{error.model.demodulize.titleize} not found", ids.presence].compact.join(": ")
  end

  def self.tool_error_response(type, message)
    with_text_content(MCP::Tool::Response.new(error: true, structured_content: { error: type, message: message }))
  end

  # Clients that ignore structuredContent read only content, so a structured-only result is
  # mirrored into a JSON text block, as the MCP spec recommends.
  def self.with_text_content(response)
    return response unless response.is_a?(MCP::Tool::Response)
    return response if response.structured_content.nil? || response.content.any?

    MCP::Tool::Response.new(
      [{ type: "text", text: response.structured_content.to_json }],
      error: response.error?,
      structured_content: response.structured_content,
      meta: response.meta,
    )
  end
end
