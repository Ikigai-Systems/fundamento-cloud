class UpdateDocumentTool < ApplicationTool
  description "Use this tool to update an existing document with Markdown content."

  input_schema(
    properties: {
      npi: { type: :string },
      markdown: { type: :string },
    },
    required: [:npi, :markdown]
  )

  annotations(
    title: "Update Document",
  )

  def self.call(npi:, markdown:, server_context:)
    pundit_user = pundit_user_from_context(server_context)

    document = DocumentService.new(pundit_user: pundit_user).update!(
      document_npi: npi,
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