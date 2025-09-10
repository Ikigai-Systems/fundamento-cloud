# frozen_string_literal: true

class ApplicationTool < MCP::Tool
  # write your custom logic to be shared across all tools here

  def self.pundit_user_from_context(server_context)
    user = User.find(server_context[:user_id])
    organization = user.organizations.find(server_context[:organization_id])

    PolicyUserContext.new(
      user,
      organization
    )
  end
end
