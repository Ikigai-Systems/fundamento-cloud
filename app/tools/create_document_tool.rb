class CreateDocumentTool < ApplicationTool
  description "Use this tool to create a new document from Markdown content."

  input_schema(
    properties: {
      space_id: { type: :string },
      parent_document_id: { type: :string },
      title: { type: :string, description: "Title, stored as given." },
      icon: { type: :string, description: "Optional single emoji to use as the document's icon." },
      markdown: { type: :string },
    },
    required: [:space_id, :title, :markdown]
  )

  annotations(
    title: "Create Document",
    destructive_hint: false,
  )

  def self.perform(space_id:, title:, markdown:, server_context:, parent_document_id: nil, icon: nil)
    pundit_user = pundit_user_from_context(server_context)

    document = DocumentService.new(pundit_user: pundit_user).create!(
      space_id:,
      parent_document_id:,
      title:,
      icon:,
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