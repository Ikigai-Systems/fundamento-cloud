class UpdateDocumentTool < ApplicationTool
  description "Use this tool to rename an existing document, change its icon or color, replace its content with Markdown, " \
              "or any mix of these; at least one of title, icon, color and markdown is required. " \
              "Replacing the content needs the sync_version you read with Read Document (live), so you never overwrite edits you did not see. " \
              "The icon is a single emoji, separate from the title; pass an empty string to remove it. " \
              "The color is one of #{HasColor::NAMES.join(", ")}; pass an empty string to remove it."

  input_schema(
    properties: {
      id: { type: :string },
      sync_version: {
        type: :integer,
        description: "The sync_version of the document as you read it. Required with markdown: if the document changed since, " \
                     "nothing is written and the error gives the current sync_version, so read it again and redo your change on that. " \
                     "The result carries the new sync_version."
      },
      title: { type: :string, description: "New title for the document, stored as given." },
      icon: { type: :string, description: "A single emoji to use as the icon, or an empty string to remove it." },
      color: { type: :string, description: "One of #{HasColor::NAMES.join(", ")}, or an empty string to remove it." },
      markdown: { type: :string, description: "New content, replacing the current content entirely, so read the document first and keep its mentions. " \
                                      "Keep the ` ^id` markers the document came with (every block with block_ids, otherwise the blocks that have comments): those blocks keep their ids. " \
                                      "#{CreateDocumentTool::MARKDOWN_HELP}" },
    },
    required: [:id]
  )

  annotations(
    title: "Update Document",
    destructive_hint: true,
  )

  def self.perform(id:, server_context:, markdown: nil, title: nil, icon: nil, color: nil, sync_version: nil)
    if !markdown.nil? && sync_version.nil?
      raise ArgumentError, "sync_version is required when you send markdown: read the document with Read Document and pass its sync_version."
    end

    pundit_user = pundit_user_from_context(server_context)

    document = DocumentService.new(pundit_user: pundit_user).update!(
      document_id: id,
      markdown: markdown,
      title: title,
      icon: icon,
      color: color,
      sync_version: sync_version
    )

    MCP::Tool::Response.new([
      {
        type: "text",
        text: DocumentBlueprint.render(document, view: :mcp, source: :live)
      }
    ])
  rescue DocumentService::StaleContent => e
    with_text_content(MCP::Tool::Response.new(
      error: true,
      structured_content: {error: "conflict", message: e.message, sync_version: e.sync_version}
    ))
  end
end
