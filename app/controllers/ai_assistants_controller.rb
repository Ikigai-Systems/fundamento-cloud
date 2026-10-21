class AiAssistantsController < ApplicationController
  include EnsureOrganization

  def show
    @mcp_url = "#{request.base_url}#{api_organization_mcp_path(current_organization)}"
  end
end
