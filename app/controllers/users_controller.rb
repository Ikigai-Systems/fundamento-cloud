class UsersController < ApplicationController
  # todo: should this be merged with admin/users_controller.rb, or separate api-like controller?
  def index
    @users = current_organization.users

    @users = @users.find(params[:user_ids]) if params[:user_ids].present?

    @users = @users.select(:id, :first_name, :last_name) if params[:mention].to_b

    respond_to do |format|
      format.json do
        if params[:mention].to_b
          render json: @users, only: [:id, :first_name, :last_name]
        else
          render json: @users
        end
      end
      format.all { head :unprocessable_content }
    end
  end

  def show
    respond_to do |format|
      format.json { render json: current_organization.users.find(params[:id]) }
      format.all { head :unprocessable_content }
    end
  end

  def suggestions
    query = params[:query]
    users = current_organization.users.query(query).limit(10)

    render json: users.map { |user| { id: user.id, display_name: user.display_name } }
  end
end
