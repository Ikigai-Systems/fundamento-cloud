# frozen_string_literal: true

# RFC 8414 — OAuth 2.0 Authorization Server Metadata.
# MCP clients fetch this to discover /oauth/authorize, /oauth/token, supported grant types, etc.
class WellKnown::OauthAuthorizationServerController < ApplicationController
  skip_before_action :verify_authenticity_token
  skip_before_action :authenticate_user!

  def show
    base = request.base_url

    render json: {
      issuer: base,
      authorization_endpoint: "#{base}/oauth/authorize",
      token_endpoint: "#{base}/oauth/token",
      registration_endpoint: "#{base}/oauth/register",
      revocation_endpoint: "#{base}/oauth/revoke",
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      scopes_supported: ["mcp"],
      token_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"],
    }
  end
end
