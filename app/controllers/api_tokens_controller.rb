class ApiTokensController < ApplicationController
  after_action :verify_authorized, except: [:index]
  before_action :ensure_turbo_request, only: [:new, :create]

  def index
    @api_tokens = pundit_user.organization_user.api_tokens
  end

  def new
    @api_token = pundit_user.organization_user.api_tokens.new
    @api_token.generate_api_token

    authorize @api_token, :create?
  end

  def create
    @api_token = pundit_user.organization_user.api_tokens.new(api_token_params)
    @api_token.organization = current_organization

    authorize @api_token, :create?

    if @api_token.save
      render :create
    else
      render :new
    end
  end

  def destroy
    @api_token = pundit_user.organization_user.api_tokens.find(params[:id])

    authorize @api_token, :destroy?

    @api_token.destroy!

    redirect_to user_api_tokens_path(current_user), notice: "API Token was removed."
  end

  protected

  def api_token_params
    params.require(:api_token).permit(:title, :encrypted_token)
  end

  def ensure_turbo_request
    redirect_to user_api_tokens_path(current_user) unless turbo_frame_request?
  end
end