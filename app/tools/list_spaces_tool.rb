class ListSpacesTool < ApplicationTool
  description "This tools lists all spaces that are available to the user."

  input_schema(
    properties: {}
  )

  annotations(
    title: "List Spaces",
    read_only_hint: true,
  )

  def self.perform(server_context:)
    pundit_user = pundit_user_from_context(server_context)

    spaces = Pundit.policy_scope!(pundit_user, pundit_user.current_organization.spaces).order(:name)

    MCP::Tool::Response.new([
      {
        type: "text",
        text: SpaceBlueprint.render(spaces, view: :mcp)
      }
    ])
  end
end