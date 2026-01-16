class ApplicationController < ActionController::Base
  include Pundit::Authorization
  include CommandPalette

  prepend_before_action :authenticate_user!

  helper_method :current_organization
  helper_method :current_organization_membership
  helper_method :current_organization_user # Legacy alias
  helper_method :subtitle
  helper_method :replays_session_sample_rate

  # Suggested in https://github.com/rails/importmap-rails?tab=readme-ov-file#include-a-digest-of-the-import-map-in-your-etag
  etag { Rails.application.importmap.digest(resolver: helpers) if request.format&.html? }

  rescue_from Pundit::NotAuthorizedError, with: :access_denied

  protected

  # Used in layouts to append text to website's <title/>
  def subtitle
    nil
  end

  def current_organization
    RequestContext.current_organization
  end

  def current_organization=(organization)
    RequestContext.current_organization = organization
  end

  def pundit_user
    PolicyUserContext.new(current_user, current_organization)
  end

  # TODO: In the future implement this as devise scope, the same way we handle Superintendents
  def current_organization_membership
    pundit_user&.organization_membership
  end

  # Legacy alias for backward compatibility
  def current_organization_user
    current_organization_membership
  end

  def verify_authorized_or_index_scoped
    if action_name == "index"
      verify_policy_scoped
    else
      verify_authorized
    end
  end

  def access_denied
    render "application/access_denied",
      layout: "application",
      status: :forbidden
  end

  def replays_session_sample_rate
    if current_user.present?
      return 0.0 if current_user.email.ends_with? "@ikigai.systems"
      return 0.0 if current_user.email.ends_with? "@marketerhub.com"
      return 0.0 if current_user.email.include? "romantyczny"
      return 0.0 if current_user.email.include? "niewiadom"
    end
    return 0.0 if ["46.175.224.203", "188.124.180.235", "89.64.16.193", "78.30.66.158", "37.31.148.78", "78.30.66.0"].include? request.remote_ip
    1.0
  end
end
