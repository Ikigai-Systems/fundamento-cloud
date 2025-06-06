# frozen_string_literal: true

class OrganizationUserAvatarComponent < ViewComponent::Base
  def initialize(organization_user:)
    @organization_user = organization_user
  end

  def online?
    @organization_user.online?
  rescue
    false
  end
end
