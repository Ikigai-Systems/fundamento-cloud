class ListSpacesTool < ApplicationTool
  description "This tools lists all spaces that are available to the user."

  input_schema(
    properties: {}
  )

  annotations(
    read_only_hint: true,
  )

  def self.call(server_context:)
    pundit_user = pundit_user_from_context(server_context)

    spaces = Pundit.policy_scope!(pundit_user, pundit_user.current_organization.spaces).order(:name)

    MCP::Tool::Response.new([
      {
        type: "text",
        text: spaces.map(&:to_react_props).to_json
      }
    ])
  end
end