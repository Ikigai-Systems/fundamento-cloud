# frozen_string_literal: true

class OrganizationUserAvatarComponent < ViewComponent::Base
  def initialize(organization_user: nil, user: nil, organization: nil)
    if organization_user.present?
      @user = organization_user.user
      @organization = organization_user.organization
    else
      @user = user
      @organization = organization
    end
  end

  def online?
    @organization.presence && @user.online?(@organization)
  rescue
    false
  end
end
