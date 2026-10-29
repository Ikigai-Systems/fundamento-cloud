class CreateDocumentTool < ApplicationTool
  MARKDOWN_HELP = "GitHub-flavored Markdown. Link to another document or table with a mention, not a URL: " \
                  "<span data-mention=\"document\" data-entity-id=\"ID\">Title</span> (entity \"document\" or \"table\"; " \
                  "find the ID with the Search tool, which returns the snippet ready to paste)."

  description "Use this tool to create a new document from Markdown content. #{MARKDOWN_HELP}"

  input_schema(
    properties: {
      space_id: { type: :string },
      parent_document_id: { type: :string },
      title: { type: :string, description: "Title, stored as given." },
      icon: { type: :string, description: "Optional single emoji to use as the document's icon." },
      color: { type: :string, description: "Optional color label, one of #{HasColor::NAMES.join(", ")}." },
      markdown: { type: :string, description: MARKDOWN_HELP },
    },
    required: [:space_id, :title, :markdown]
  )

  annotations(
    title: "Create Document",
    destructive_hint: false,
  )

  def self.perform(space_id:, title:, markdown:, server_context:, parent_document_id: nil, icon: nil, color: nil)
    pundit_user = pundit_user_from_context(server_context)

    document = DocumentService.new(pundit_user: pundit_user).create!(
      space_id:,
      parent_document_id:,
      title:,
      icon:,
      color:,
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