# frozen_string_literal: true

class UserAvatar < ViewComponent::Base
  def initialize(organization_user: nil, user: nil, organization: nil, size: "md")
    @size = size.to_sym

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

  def size_to_dimensions
    mapping = {
      xs: 16,
      sm: 24,
      md: 32,
      lg: 64,
      xl: 128
    }

    mapping[@size] || mapping[:xs]
  end

  def size_to_class
    "size-#{size_to_dimensions}"
  end
end
