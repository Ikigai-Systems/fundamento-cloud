# frozen_string_literal: true

class WellKnown::OauthProtectedResourceController < ApplicationController
  skip_before_action :verify_authenticity_token

  def show
    base = request.base_url

    render json: {
      resource: "#{base}/api/mcp",
      authorization_servers: [base],
      bearer_methods_supported: ["header"],
      scopes_supported: ["mcp"],
    }
  end
end
