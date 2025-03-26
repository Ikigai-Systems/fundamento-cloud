class Api::V1::UsersController < Api::ApiController
  skip_before_action :authenticate_user_from_api_token!
  before_action :authenticate_user_from_jwt_token!

  def show
    @user = User.find_by(id: params[:id])

    render json: @user
  end
end