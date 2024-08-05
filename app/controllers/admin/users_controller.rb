class Admin::UsersController < ApplicationController
  def index
    @users = current_organization.users.all
  end
end