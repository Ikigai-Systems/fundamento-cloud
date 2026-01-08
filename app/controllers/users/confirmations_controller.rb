# frozen_string_literal: true

class Users::ConfirmationsController < Devise::ConfirmationsController
  def pending
    # Renders the pending view
  end

  private

  def after_confirmation_path_for(resource_name, resource)
    sign_in(resource)
    super
  end
end