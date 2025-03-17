class UsersController < ApplicationController
  # todo: should this be merged with admin/users_controller.rb, or separate api-like controller?
  def index
    respond_to do |format|
      format.json do
        if params[:user_ids].present?
          render json: current_organization.users.find(params[:user_ids])
        else
          render json: current_organization.users
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
