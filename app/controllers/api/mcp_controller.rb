class Api::McpController < Api::ApiController
  def create
    server = MCP::Server.new(
      name: Rails.application.class.module_parent_name.underscore.dasherize,
      title: "Fundamento",
      version: "1.0.1",
      description: "Collaborative workspace platform for documents and structured data.",
      website_url: "https://fundamento.cloud",
      instructions: <<~INSTRUCTIONS,
        Use ListSpaces first to discover available spaces and their IDs.
        Documents are identified by a short non-predictable string ID (visible in URLs like /d/<id>).
        Tables are identified by a short non-predictable string ID (URLs like /t/<id>); use DescribeTable before reading or writing rows.
        RunFormula evaluates Excel-like formulas against the workspace data — see https://docs.fundamento.it/formulas/reference.
        All write operations (CreateDocument, UpdateDocument, AddRow, UpdateRows, AddOrUpdateRows) are permanent.
      INSTRUCTIONS
      tools: [
        ListSpacesTool,
        ReadDocumentTool,
        CreateDocumentTool,
        UpdateDocumentTool,
        ImportDocumentTool,
        ListObjectsByTagsTool,
        AddTagsTool,
        RemoveTagsTool,
        UpdateTagsTool,
        RunFormulaTool,
        ListTablesTool,
        DescribeTableTool,
        ReadTableTool,
        AddRowTool,
        UpdateRowsTool,
        AddOrUpdateRowsTool,
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