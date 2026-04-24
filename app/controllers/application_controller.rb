class ApplicationController < ActionController::Base
  include Pundit::Authorization
  include CommandPalette
  include ActiveStorage::SetCurrent

  prepend_before_action :authenticate_user!
  before_action :capture_reddit_click_id

  helper_method :current_organization
  helper_method :current_organization_membership
  helper_method :subtitle

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

  def capture_reddit_click_id
    return unless params[:rdt_cid].present?
    session[:reddit_click_id] = params[:rdt_cid]
  end

end
