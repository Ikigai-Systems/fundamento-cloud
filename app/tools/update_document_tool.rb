class UpdateDocumentTool < ApplicationTool
  description "Use this tool to rename an existing document, change its icon or color, replace its content with Markdown, " \
              "or any mix of these; at least one of title, icon, color and markdown is required. " \
              "The icon is a single emoji, separate from the title; pass an empty string to remove it. " \
              "The color is one of #{HasColor::NAMES.join(", ")}; pass an empty string to remove it."

  input_schema(
    properties: {
      id: { type: :string },
      title: { type: :string, description: "New title for the document, stored as given." },
      icon: { type: :string, description: "A single emoji to use as the icon, or an empty string to remove it." },
      color: { type: :string, description: "One of #{HasColor::NAMES.join(", ")}, or an empty string to remove it." },
      markdown: { type: :string, description: "New content, replacing the current content entirely, so read the document first and keep its mentions. #{CreateDocumentTool::MARKDOWN_HELP}" },
    },
    required: [:id]
  )

  annotations(
    title: "Update Document",
    destructive_hint: true,
  )

  def self.perform(id:, server_context:, markdown: nil, title: nil, icon: nil, color: nil)
    pundit_user = pundit_user_from_context(server_context)

    document = DocumentService.new(pundit_user: pundit_user).update!(
      document_id: id,
      markdown: markdown,
      title: title,
      icon: icon,
      color: color
    )

    MCP::Tool::Response.new([
      {
        type: "text",
        text: DocumentBlueprint.render(document, view: :mcp)
      }
    ])
  end
end
