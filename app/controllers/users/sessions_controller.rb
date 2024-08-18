class Users::SessionsController < Devise::SessionsController
  skip_before_action :ensure_organization_exists
  skip_before_action :select_current_organization
end