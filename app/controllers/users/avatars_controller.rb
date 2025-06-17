# frozen_string_literal: true

class Users::AvatarsController < ApplicationController
  before_action :ensure_turbo_request, only: [:edit]
  before_action { @user = current_user }

  def edit
  end

  def update
    if @user.update(update_params)
      render turbo_stream: turbo_stream.redirect_to(edit_user_registration_path)
    else
      render :edit
    end
  end

  protected

  def ensure_turbo_request
    redirect_to edit_user_registration_path unless turbo_frame_request?
  end

  def update_params
    params.require(:user).permit(:avatar)
  end
end