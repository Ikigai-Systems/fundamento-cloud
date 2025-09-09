class Api::V1::UsersController < Api::ApiController
  def show
    @user = User.find(params[:id])

    pundit_user = PolicyUserContext.new(current_organization_user.user, current_organization_user.organization)

    Pundit.authorize(pundit_user, @user, :show?)

    render json: @user
  rescue Pundit::NotAuthorizedError, ActiveRecord::RecordNotFound => e
    render json: "'#{params[:id]}' is invalid user reference", status: :not_found
  end
end