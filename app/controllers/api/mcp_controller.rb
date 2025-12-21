class Api::McpController < Api::ApiController
  def create
    server = MCP::Server.new(
      name: Rails.application.class.module_parent_name.underscore.dasherize,
      version: "1.0.1",
      tools: [
        ListSpacesTool,
        ReadDocumentTool,
        CreateDocumentTool,
        UpdateDocumentTool,
        ListObjectsByTagsTool,
        AddTagsTool,
        RemoveTagsTool,
        UpdateTagsTool,
        RunFormulaTool,
      ],
      # prompts: [MyPrompt],
      server_context: {
        user_id: current_user.id,
        organization_id: current_organization.id,
      },
    )

    render(json: server.handle_json(request.body.read))
  end

  alias_method :show, :create
end