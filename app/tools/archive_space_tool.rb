class ArchiveSpaceTool < ApplicationTool
  description "Archive a space. Only organization managers can archive spaces."

  input_schema(
    properties: {
      space_id: { type: "string", description: "The NPI (ID) of the space to archive" },
    },
    required: [:space_id]
  )

  annotations(
    title: "Archive Space",
    read_only_hint: false,
    destructive_hint: false,
  )

  def self.perform(space_id:, server_context:)
    pundit_user = pundit_user_from_context(server_context)

    space = pundit_user.current_organization.spaces.find(space_id)
    Pundit.authorize(pundit_user, space, :archive?)
    space.update!(archived: true)

    MCP::Tool::Response.new([
      {
        type: "text",
        text: "Space \"#{space.name}\" has been archived."
      }
    ])
  end
end
