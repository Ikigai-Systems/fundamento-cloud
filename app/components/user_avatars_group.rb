# frozen_string_literal: true

class UserAvatarsGroup < ViewComponent::Base
  Z_INDEX_CLASSES = %w[z-30 z-20 z-10 z-0].freeze

  OVERFLOW_TEXT_CLASSES = {
    xs: "text-[8px]",
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
    xl: "text-base"
  }.freeze

  def initialize(users:, organization:, max: 4, variant: "sm")
    @users = users.to_a
    @organization = organization
    @max = max
    @variant = variant.to_sym
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

  def avatar_size_class
    UserAvatar::VARIANT_CLASSES[@variant] || UserAvatar::VARIANT_CLASSES[:xs]
  end

  def overflow_text_class
    OVERFLOW_TEXT_CLASSES[@variant] || OVERFLOW_TEXT_CLASSES[:xs]
  end
end
