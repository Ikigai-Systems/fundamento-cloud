class Api::V1::UsersController < Api::ApiController
  skip_before_action :authenticate_user_from_api_token!
  before_action :authenticate_user_from_jwt_token!

  def show
    # todo: security-wise, narrow down users to current_organization only (https://chat.google.com/room/AAAAOKLZy5A/DbENQFvd5k8/DbENQFvd5k8?cls=10)
    @user = User.find_by(id: params[:id])

    render json: @user
  end
end