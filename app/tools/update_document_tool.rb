class UpdateDocumentTool < ApplicationTool
  description "Use this tool to update an existing document with Markdown content."

  input_schema(
    properties: {
      id: { type: :string },
      markdown: { type: :string },
    },
    required: [:id, :markdown]
  )

  annotations(
    title: "Update Document",
  )

  def self.call(id:, markdown:, server_context:)
    pundit_user = pundit_user_from_context(server_context)

    document = DocumentService.new(pundit_user: pundit_user).update!(
      document_id: id,
      markdown: markdown
    )

    MCP::Tool::Response.new([
      {
        type: "text",
        text: DocumentBlueprint.render(document, view: :mcp)
      }
    ])
  end
end