class Api::McpController < Api::ApiController
  skip_before_action :authenticate_user_from_headers!
  before_action :authenticate_mcp_request!

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

  private

  def authenticate_mcp_request!
    # Try Doorkeeper OAuth token first (browser-based OAuth flow)
    if authenticate_with_doorkeeper_token
      return
    end

    # Fall back to existing API token / JWT strategies (backward compat)
    if request.env["warden"].authenticate(:api_token, :jwt, scope: :user)
      return
    end

    # Neither worked — return 401 with OAuth discovery header so MCP clients
    # know where to initiate the browser-based auth flow.
    response.headers["WWW-Authenticate"] =
      %(Bearer resource_metadata="#{request.base_url}/.well-known/oauth-protected-resource")
    head :unauthorized
  end

  def authenticate_with_doorkeeper_token
    token_string = bearer_token
    return false if token_string.blank?

    oauth_token = Doorkeeper::AccessToken.by_token(token_string)
    return false unless oauth_token&.accessible?

    membership_id = oauth_token.organization_membership_id
    return false if membership_id.blank?

    membership = OrganizationMembership.find_by(id: membership_id)
    return false unless membership

    RequestContext.current_organization = membership.organization
    sign_in(membership.user, scope: :user)
    true
  end

  def bearer_token
    auth = request.headers["Authorization"]
    auth&.start_with?("Bearer ") ? auth[7..] : nil
  end
end
