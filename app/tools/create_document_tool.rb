class CreateDocumentTool < ApplicationTool
  description "Use this tool to create a new document from Markdown content."

  input_schema(
    properties: {
      space_id: { type: :string },
      parent_document_id: { type: :string },
      title: { type: :string },
      markdown: { type: :string },
    },
    required: [:space_id, :title, :markdown]
  )

  annotations(
    title: "Create Document",
  )

  def self.call(space_id:, parent_document_id:, title:, markdown:, server_context:)
    pundit_user = pundit_user_from_context(server_context)

    document = DocumentService.new(pundit_user: pundit_user).create!(
      space_id:,
      parent_document_id:,
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