# frozen_string_literal: true

# RFC 7591 — OAuth 2.0 Dynamic Client Registration.
# Allows MCP clients (Claude Desktop, Claude Code, etc.) to register themselves
# automatically without the user manually creating an OAuth application.
class Oauth::RegistrationsController < ApplicationController
  skip_before_action :verify_authenticity_token

  # POST /oauth/register
  def create
    client_name = params[:client_name].presence || "MCP Client"
    redirect_uris = Array(params[:redirect_uris])

    if redirect_uris.empty?
      return render json: { error: "invalid_client_metadata", error_description: "redirect_uris is required" }, status: :bad_request
    end

    app = Doorkeeper::Application.new(
      name: client_name,
      redirect_uri: redirect_uris.join("\n"),
      scopes: "mcp",
      confidential: false,
    )

    if app.save
      render json: {
        client_id: app.uid,
        client_secret: app.plaintext_secret.presence,
        client_name: app.name,
        redirect_uris: app.redirect_uri.split,
        grant_types: ["authorization_code"],
        scope: app.scopes.to_s,
      }.compact, status: :created
    else
      render json: {
        error: "invalid_client_metadata",
        error_description: app.errors.full_messages.join(", "),
      }, status: :bad_request
    end
  end
end
