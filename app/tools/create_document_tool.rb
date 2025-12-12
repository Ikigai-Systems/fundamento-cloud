class CreateDocumentTool < ApplicationTool
  description "Use this tool to create a new document from Markdown content."

  input_schema(
    properties: {
      space_npi: { type: :string },
      parent_document_npi: { type: :string },
      title: { type: :string },
      markdown: { type: :string },
    },
    required: [:space_npi, :title, :markdown]
  )

  annotations(
    title: "Create Document",
  )

  def self.call(space_npi:, parent_document_npi:, title:, markdown:, server_context:)
    pundit_user = pundit_user_from_context(server_context)

    document = DocumentService.new(pundit_user: pundit_user).create!(
      space_npi:,
      parent_document_npi:,
      title:,
      markdown:
    )

    MCP::Tool::Response.new([
      {
        type: "text",
        text: DocumentBlueprint.render(document, view: :mcp)
      }
    ])
  end
end