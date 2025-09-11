class GetDocumentTool < ApplicationTool
  description "This tool retrieves a document content."

  input_schema(
    properties: {
      npi: { type: :string },
    },
    required: [:npi]
  )

  annotations(
    title: "Get Document",
    read_only_hint: true,
  )

  def self.call(npi:, server_context:)
    pundit_user = pundit_user_from_context(server_context)

    document  = pundit_user.current_organization.documents.find_by_param!(npi)

    Pundit.authorize(pundit_user, document, :show?)

    MCP::Tool::Response.new([
      {
        type: "text",
        text: DocumentBlueprint.render(document, view: :mcp)
      }
    ])
  end
end