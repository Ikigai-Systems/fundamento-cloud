class UsersController < ApplicationController
  include EnsureOrganization

  # todo: should this be merged with admin/users_controller.rb, or separate api-like controller?
  def index
    @users = current_organization.users.includes(avatar_attachment: { blob: { variant_records: { image_attachment: :blob } } })

    @users = @users.find(params[:user_ids]) if params[:user_ids].present?

    respond_to do |format|
      format.json { render json: UserBlueprint.render(@users, view: :with_avatar) }
      format.all { head :unprocessable_content }
    end
  end

  def show
    respond_to do |format|
      format.json { render json: UserBlueprint.render(current_organization.users.find(params[:id]), view: :with_avatar) }
      format.all { head :unprocessable_content }
    end
  end

  def suggestions
    query = params[:query]
    users = current_organization.users.query(query).limit(10)

    render json: users.map { |user| { id: user.id, display_name: user.display_name } }
  end
end
