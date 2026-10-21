# frozen_string_literal: true

class WellKnown::OauthProtectedResourceController < ApplicationController
  skip_before_action :verify_authenticity_token
  skip_before_action :authenticate_user!

  def show
    base = request.base_url
    # Clients require `resource` to equal the URL they connect to. Not checked against the
    # database, so the metadata doesn't reveal which organizations exist.
    path = params[:organization_id] ? api_organization_mcp_path(params[:organization_id]) : api_mcp_path

    render json: {
      resource: "#{base}#{path}",
      authorization_servers: [base],
      bearer_methods_supported: ["header"],
      scopes_supported: ["mcp"],
    }
  end
end
