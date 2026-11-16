class ReadDocumentTool < ApplicationTool
  description "Use this tool to read a document as Markdown."

  input_schema(
    properties: {
      id: { type: :string },
      frontmatter: {
        type: :boolean,
        description: "Prefix the Markdown content with a YAML frontmatter block holding title, tags, icon and color. Default false."
      },
      block_ids: {
        type: :boolean,
        description: "End every block with its id as a ` ^id` marker (a `^id` line of its own after code, tables and media). " \
                     "Keep the markers when you update the document and the blocks keep their ids, so comments and links " \
                     "to them survive. Default false."
      },
    },
    required: [:id]
  )

  annotations(
    title: "Read Document",
    read_only_hint: true,
    destructive_hint: false,
  )

  def self.perform(id:, server_context:, frontmatter: false, block_ids: false)
    pundit_user = pundit_user_from_context(server_context)

    document  = pundit_user.current_organization.documents.find(id)

    Pundit.authorize(pundit_user, document, :show?)

    text = DocumentBlueprint.render(document, view: :mcp, frontmatter: frontmatter == true, block_ids: block_ids == true)

    MCP::Tool::Response.new([{type: "text", text: text}])
  end
end