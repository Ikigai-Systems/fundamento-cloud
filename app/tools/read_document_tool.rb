class ReadDocumentTool < ApplicationTool
  description "Use this tool to read a document as Markdown."

  input_schema(
    properties: {
      id: { type: :string },
    },
    required: [:id]
  )

  annotations(
    title: "Read Document",
    read_only_hint: true,
  )

  def self.call(id:, server_context:)
    pundit_user = pundit_user_from_context(server_context)

    document  = pundit_user.current_organization.documents.find(id)

    Pundit.authorize(pundit_user, document, :show?)

    MCP::Tool::Response.new([
      {
        type: "text",
        text: DocumentBlueprint.render(document, view: :mcp)
      }
    ])
  end
end