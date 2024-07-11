class ApplicationController < ActionController::Base
  before_action :ensure_organization_exists

  def ensure_organization_exists
    if current_user.present? && current_user.organizations.empty?
      redirect_to new_organization_path, notice: "Awesome to have you here! Now let's create an organization for you and your team."
    end
  end
end
