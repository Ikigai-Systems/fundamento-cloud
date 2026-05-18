# frozen_string_literal: true

Doorkeeper.configure do
  orm :active_record

  # Integrate with Devise: use the current signed-in user as resource owner.
  resource_owner_authenticator do
    current_user || redirect_to(new_user_session_url)
  end

  # Only authorization code flow — the only flow required by the MCP spec.
  grant_flows %w[authorization_code]

  # PKCE is required by the MCP authorization spec.
  force_pkce

  # Issue refresh tokens so desktop clients (Claude Desktop, Claude Code) don't
  # prompt the user again after the access token expires.
  use_refresh_token

  access_token_expires_in 2.hours

  # Allow localhost redirect URIs so Claude Desktop and similar desktop apps can
  # receive the authorization code via a local server.
  force_ssl_in_redirect_uri { |uri| uri.host != "localhost" }

  # Single scope for now. Fine-grained scopes (per space, read-only, etc.) can
  # be added later without breaking existing tokens.
  default_scopes :mcp

  # Propagate organization_membership_id from the authorization grant to the
  # access token. The authorization view sends it as a form field when the user
  # selects which organization to authorize.
  custom_access_token_attributes [:organization_membership_id]

  # After the user approves, store the chosen org on the access grant.
  # custom_access_token_attributes handles copying it to the access token automatically.
  after_successful_authorization do |controller, _context|
    # Nothing extra needed — custom_access_token_attributes propagates the field.
    # Kept as a hook point for future audit logging.
  end
end
