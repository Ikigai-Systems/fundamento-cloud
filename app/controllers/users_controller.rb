class UsersController < ApplicationController
  # todo: should this be merged with admin/users_controller.rb, or separate api-like controller?
  def index
    respond_to do |format|
      format.json { render json: current_organization.users }
      format.all { head :unprocessable_content }
    end
  end

  def show
    respond_to do |format|
      format.json { render json: current_organization.users.find(params[:id]) }
      format.all { head :unprocessable_content }
    end
  end
end
