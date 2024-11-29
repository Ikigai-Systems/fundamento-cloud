class ApiTokensController < ApplicationController
  def index
    @api_tokens = pundit_user.organization_user.api_tokens
  end
end