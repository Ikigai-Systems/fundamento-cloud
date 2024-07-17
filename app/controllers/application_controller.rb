class ApplicationController < ActionController::Base
  before_action :authenticate_user!

  before_action :ensure_organization_exists
  before_action :select_current_organization
  before_action :load_current_organization_from_cookie
  before_action :ensure_space_exists

  helper_method :current_organization

  # Suggested in https://github.com/rails/importmap-rails?tab=readme-ov-file#include-a-digest-of-the-import-map-in-your-etag
  etag { Rails.application.importmap.digest(resolver: helpers) if request.format&.html? }

  protected

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
  end

  def ensure_space_exists
    if current_user.present? && current_organization.present? && current_organization.spaces.empty?
      current_organization.spaces.create!
    end
  end

  def current_organization
    RequestContext.current_organization
  end
end
