class UsersController < ApplicationController
  include EnsureOrganization

  # todo: should this be merged with admin/users_controller.rb, or separate api-like controller?
  def index
    @users = current_organization.users.includes(avatar_attachment: { blob: { variant_records: { image_attachment: :blob } } })

    @users = @users.find(params[:user_ids]) if params[:user_ids].present?

    @users = @users.select(:id, :email, :first_name, :last_name) if params[:mention].to_b

    respond_to do |format|
      format.json do
        if params[:mention].to_b
          render json: @users.map { |user| user_json(user, only: [:id, :first_name, :last_name]) }
        else
          render json: @users.map { |user| user_json(user) }
        end
      end
      format.all { head :unprocessable_content }
    end
  end

  def show
    respond_to do |format|
      format.json { render json: user_json(current_organization.users.find(params[:id])) }
      format.all { head :unprocessable_content }
    end
  end

  def suggestions
    query = params[:query]
    users = current_organization.users.query(query).limit(10)

    render json: users.map { |user| { id: user.id, display_name: user.display_name } }
  end

  private

  # React draws a user the way the UserAvatar component does: the uploaded
  # picture, or initials from the display name, which falls back to the email.
  def user_json(user, **options)
    user.as_json(options).merge(
      "display_name" => user.display_name,
      "avatar_url" => (url_for(user.avatar_variant(:md)) if user.avatar.attached?),
    )
  end
end
