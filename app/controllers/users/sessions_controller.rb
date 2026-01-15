class Users::SessionsController < Devise::SessionsController

  protected

  def after_sign_out_path_for(resource_name)
    if params[:return_to].present?
      params[:return_to]
    else
      super
    end
  end
end