class Api::McpController < Api::ApiController
  # Table writes made by the MCP tools are attributed to the agent, not to a browser.
  def current_change_source = "mcp"

  before_action :ensure_requested_organization!, if: -> { params[:organization_id] }

  def create
    server = MCP::Server.new(
      name: Rails.application.class.module_parent_name.underscore.dasherize,
      title: "Fundamento",
      version: Fundamento::VERSION,
      description: "Collaborative workspace platform for documents and structured data.",
      website_url: "https://fundamento.cloud",
      instructions: <<~INSTRUCTIONS,
        Use ListSpaces first to discover available spaces and their IDs.
        Documents are identified by a short non-predictable string ID (visible in URLs like /d/<id>).
        Tables are identified by a short non-predictable string ID (URLs like /t/<id>); use DescribeTable before reading or writing rows.
        RunFormula evaluates Excel-like formulas against the workspace data — see https://docs.fundamento.it/formulas/reference.
        All write operations (CreateDocument, UpdateDocument, UpdateTable, AddRow, UpdateRows, AddOrUpdateRows) are permanent.
        Icons are a separate field from titles: a single emoji, returned as {type, value} and set with the icon parameter.
        Colors are a separate field too: one of #{HasColor::NAMES.join(", ")}, set with the color parameter.
        UpdateDocument renames a document, changes its icon and/or color and/or replaces its content; UpdateTable renames a table and/or changes its icon and/or color.
        Use ArchiveSpace and UnarchiveSpace to archive or unarchive spaces (manager role required).
        Use Search to find documents and tables by title, tags, space and update time; it does not search document content.
        To link to a document or table in Markdown, write a mention, not a URL:
        <span data-mention="document" data-entity-id="ID">Title</span> (entity: document or table; ID as in /d/<id>, /t/<id>).
        Search results include a ready-made `mention` snippet. ReadDocument returns existing mentions in the same form, so keep them when you edit.
      INSTRUCTIONS
      tools: [
        ListSpacesTool,
        ArchiveSpaceTool,
        UnarchiveSpaceTool,
        ReadDocumentTool,
        CreateDocumentTool,
        UpdateDocumentTool,
        UpdateTableTool,
        ImportDocumentTool,
        ListObjectsByTagsTool,
        SearchTool,
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

    # A server is built per request, so no session outlives it: stateless mode stops `initialize` from
    # promising list-changed notifications we can't deliver, and `render` can't hold open the SSE stream
    # `subscriptions/listen` needs. Rails' host authorization already checks Host; the transport still
    # checks Origin.
    transport = MCP::Server::Transports::StreamableHTTPTransport.new(
      server,
      stateless: true,
      enable_json_response: true,
      serve_subscriptions_listen: false,
      allowed_hosts: [request.host],
    )
    status, headers, body = transport.handle_request(request)

    response.headers.merge!(headers.except("content-type"))
    render(body: body.join, status: status, content_type: headers["content-type"])
  end

  alias_method :show, :create

  private

  # A token for another organization, or an organization the user isn't in, gets the same
  # invalid_token answer: the client re-authorizes, and the organization's existence isn't revealed.
  def ensure_requested_organization!
    return if current_organization&.id == params[:organization_id]

    response.headers["WWW-Authenticate"] =
      %(Bearer error="invalid_token", resource_metadata="#{protected_resource_metadata_url}")
    head :unauthorized
  end

  def protected_resource_metadata_url
    return super unless params[:organization_id]

    "#{super}#{api_organization_mcp_path(params[:organization_id])}"
  end
end
