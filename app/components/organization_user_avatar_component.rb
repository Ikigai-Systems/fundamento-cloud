# frozen_string_literal: true

class OrganizationUserAvatarComponent < ViewComponent::Base
  def initialize(organization_user:)
    @organization_user = organization_user
  end
end
