class ReadDocumentTool < ApplicationTool
  description "Use this tool to read a document as Markdown."

  input_schema(
    properties: {
      id: { type: :string },
      frontmatter: {
        type: :boolean,
        description: "Prefix the Markdown content with a YAML frontmatter block holding title, tags, icon and color. Default false."
      },
    },
    required: [:id]
  )

  annotations(
    title: "Read Document",
    read_only_hint: true,
    destructive_hint: false,
  )

  def self.perform(id:, server_context:, frontmatter: false)
    pundit_user = pundit_user_from_context(server_context)

    document  = pundit_user.current_organization.documents.find(id)

    Pundit.authorize(pundit_user, document, :show?)

    text = if frontmatter == true
      json = JSON.parse(DocumentBlueprint.render(document, view: :mcp))
      json["content"] = DocumentService.new(pundit_user: pundit_user).build_frontmatter(document) + json["content"]
      JSON.generate(json)
    else
      DocumentBlueprint.render(document, view: :mcp)
    end

    MCP::Tool::Response.new([{type: "text", text: text}])
  end
end