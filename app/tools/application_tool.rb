# frozen_string_literal: true

class ApplicationTool < MCP::Tool
  # All Fundamento tools operate only within the workspace — never open-world.
  # Override annotations to inject this default so subclasses don't repeat it.
  def self.annotations(hash = MCP::Tool::NOT_SET)
    hash == MCP::Tool::NOT_SET ? super : super({ open_world_hint: false }.merge(hash))
  end

  def self.call(**kwargs)
    perform(**kwargs)
  rescue ActiveRecord::RecordNotFound => e
    tool_error_response("not_found", "Resource not found: #{e.message}")
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

  def self.tool_error_response(type, message)
    MCP::Tool::Response.new(error: true, structured_content: { error: type, message: message })
  end
end
