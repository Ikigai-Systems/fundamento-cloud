class SessionsController < Devise::SessionsController
  skip_before_action :ensure_organization_exists
end