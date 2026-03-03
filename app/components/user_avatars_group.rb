# frozen_string_literal: true

class UserAvatarsGroup < ViewComponent::Base
  Z_INDEX_CLASSES = %w[z-30 z-20 z-10 z-0].freeze

  def initialize(users:, organization:, max: 4, variant: "sm")
    @users = users.to_a
    @organization = organization
    @max = max
    @variant = variant
  end

  def render?
    @users.any?
  end

  def visible_users
    if overflow?
      @users.first(@max - 1)
    else
      @users
    end
  end

  def overflow_users
    @users[(@max - 1)..]
  end

  def overflow?
    @users.length > @max
  end

  def overflow_count
    @users.length - (@max - 1)
  end

  def z_class(index)
    Z_INDEX_CLASSES[index] || "z-0"
  end

  def overflow_z_class
    Z_INDEX_CLASSES[visible_users.length] || "z-0"
  end

  VARIANT_SIZES = { xs: 16, sm: 24, md: 32, lg: 64, xl: 128 }.freeze

  def avatar_size_class
    "size-#{VARIANT_SIZES[@variant.to_sym] || VARIANT_SIZES[:xs]}"
  end
end
