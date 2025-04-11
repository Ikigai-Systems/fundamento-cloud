class ApplicationController < ActionController::Base
  include Pundit::Authorization
  include CommandPalette

  prepend_before_action :authenticate_user!

  before_action :ensure_organization_exists
  before_action :select_current_organization
  before_action :load_current_organization_from_cookie
  before_action :ensure_space_exists

  helper_method :current_organization
  helper_method :current_organization_user
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

  def ensure_organization_exists
    if current_user.present? && current_user.organizations.size == 0
      redirect_to new_organization_path, notice: "Awesome to have you here! Now let's create an organization for you and your team."
    end
  end

  def select_current_organization
    return if cookies.encrypted[:organization_id].present?

    return if current_user.nil?

    if current_user.organizations.size == 1
      cookies.encrypted[:organization_id] = current_user.organizations.first.id
    else
      redirect_to organizations_path, notice: "Please select an organization you want to switch to."
    end
  end

  def load_current_organization_from_cookie
    return if cookies.encrypted[:organization_id].nil?

    return if current_user.nil?

    RequestContext.current_organization =
      current_user.organizations.find_by_id(cookies.encrypted[:organization_id])

    if RequestContext.current_organization.nil?
      # Cookie has invalid value, so let's retry selecting it
      cookies.encrypted[:organization_id] = nil

      select_current_organization
    end
  end

  def ensure_space_exists
    if current_user.present? && current_organization.present? && current_organization.spaces.empty?
      current_organization.spaces.create!(name: "Default")
    end
  end

  def current_organization
    RequestContext.current_organization
  end

  def pundit_user
    PolicyUserContext.new(current_user, current_organization)
  end

  # TODO: In the future implement this as devise scope, the same way we handle Superintendents
  def current_organization_user
    pundit_user&.organization_user
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
    else
      return 0.0 if ["46.175.224.203", "188.124.180.235", "89.64.16.193", "78.30.66.158", "37.31.148.78", "78.30.66.0"].include? request.remote_ip
    end
    1.0
  end
end
