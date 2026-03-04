# frozen_string_literal: true

class UserAvatar < ViewComponent::Base
  VARIANT_SIZES = { xs: 16, sm: 24, md: 32, lg: 64, xl: 128 }.freeze
  VARIANT_CLASSES = { xs: "size-4", sm: "size-6", md: "size-8", lg: "size-16", xl: "size-32" }.freeze

  def initialize(organization_membership: nil, user: nil, organization: nil, variant: "md")
    @variant = variant.to_sym

    if organization_membership.present?
      @user = organization_membership.user
      @organization = organization_membership.organization
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

  def variant_to_dimensions
    VARIANT_SIZES[@variant] || VARIANT_SIZES[:xs]
  end

  def variant_to_class
    VARIANT_CLASSES[@variant] || VARIANT_CLASSES[:xs]
  end
end
