class UnarchiveSpaceTool < ApplicationTool
  description "Unarchive a space. Only organization managers can unarchive spaces."

  input_schema(
    properties: {
      space_id: { type: "string", description: "ID of the space to unarchive" },
    },
    required: [:space_id]
  )

  annotations(
    title: "Unarchive Space",
    read_only_hint: false,
    destructive_hint: false,
  )

  def self.perform(space_id:, server_context:)
    pundit_user = pundit_user_from_context(server_context)

    space = pundit_user.current_organization.spaces.find(space_id)
    Pundit.authorize(pundit_user, space, :unarchive?)
    space.update!(archived: false)

    MCP::Tool::Response.new([
      {
        type: "text",
        text: "Space \"#{space.name}\" has been unarchived."
      }
    ])
  end
end
