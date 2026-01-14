class User < ApplicationRecord
  include NpiOrdering

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable

  devise :invitable,
    :database_authenticatable,
    :registerable,
    :recoverable,
    :rememberable,
    :validatable,
    :trackable,
    :confirmable

  unless Rails.env.standalone?
    devise :magic_link_authenticatable
  end

  before_create :skip_confirmation_if_not_required
  before_validation :derive_name_from_email, if: -> { email.present? && first_name.blank? && last_name.blank? }

  scope :query, ->(query) { where("(first_name || ' ' || last_name) ILIKE ?", "%#{query}%") }

  has_many :organizations_users, class_name: :OrganizationUser, dependent: :destroy
  has_many :organizations, through: :organizations_users
  has_many :public_links, foreign_key: :updated_by_id, dependent: :nullify

  has_many :team_memberships, through: :organizations_users
  has_many :teams, through: :team_memberships, dependent: :destroy
  has_many :visited_objects, class_name: "ObjectVisitor", dependent: :delete_all

  has_one_attached :avatar do |attachable|
    attachable.variant :xs, resize_to_fill: [16, 16]
    attachable.variant :sm, resize_to_fill: [24, 24]
    attachable.variant :md, resize_to_fill: [32, 32]
    attachable.variant :lg, resize_to_fill: [64, 64]
    attachable.variant :xl, resize_to_fill: [128, 128]
  end

  validates_presence_of :first_name, if: -> { Flipper.enabled?(:standalone) }
  validates_presence_of :last_name, if: -> { Flipper.enabled?(:standalone) }
  validate :validate_avatar_format

  after_commit :process_avatar_variants, on: [:create, :update]

  def initials
    return "" if first_name.blank?
    first_initial = first_name.first(1)
    last_initial = last_name.present? ? last_name.first(1) : ""
    first_initial + last_initial
  end

  def display_name
    return email if first_name.blank? && last_name.blank?
    [first_name, last_name].compact.join(" ")
  end

  def online?(for_organization)
    OnlineUsersTracker.online?(for_organization, self)
  end

  def last_online_at(for_organization)
    OnlineUsersTracker.last_online_at(for_organization, self)
  end

  def change_to_online(for_organization)
    OnlineUsersTracker.change_to_online(for_organization, self)
  end

  def change_to_offline(for_organization)
    OnlineUsersTracker.change_to_offline(for_organization, self)
  end

  def visit_object(object)
    self.visited_objects.find_or_initialize_by(
      object_type: object.class.to_s,
      object_id: object.id
    ).update!(visited_at: Time.now)
  end

  # Do not allow user to reset its password until it accepts the invitation
  # Taken from https://github.com/scambra/devise_invitable/wiki/Disabling-devise-recoverable,-if-invitation-was-not-accepted
  def send_reset_password_instructions
    super if invitation_token.nil?
  end

  def avatar_variant(size = :lg)
    return unless avatar.attached?

    # SVG files don't need variants as they're vector-based and scalable
    if avatar.content_type == 'image/svg+xml'
      avatar
    else
      avatar.variant(size)
    end
  end

  private

  def derive_name_from_email
    # Extract username part before @
    username = email.split('@').first
    return if username.blank?

    # Split by common separators (., _, -)
    parts = username.split(/[._-]/).map(&:capitalize)

    if parts.length >= 2
      self.first_name = parts.first
      self.last_name = parts[1..-1].join(' ')
    elsif parts.length == 1
      # Single word - use as first name, leave last name nil
      self.first_name = parts.first
      self.last_name = nil
    end
  end

  def skip_confirmation_if_not_required
    # Auto-confirm user if in standalone mode
    skip_confirmation! if Flipper.enabled?(:standalone)
  end

  def validate_avatar_format
    return unless avatar.attached?
    
    # Use a more direct approach to get the uploaded file data
    blob = avatar.blob
    return unless blob
    
    unless blob.content_type.in?(%w[image/jpeg image/png image/gif image/webp image/svg+xml])
      errors.add(:avatar, 'must be a JPEG, PNG, GIF, WebP, or SVG image')
    end
    
    if blob.byte_size > 5.megabytes
      errors.add(:avatar, 'must be less than 5MB')
    end
  rescue => e
    Rails.logger.error "Avatar validation error: #{e.message}"
    # Don't block the upload, just log the error
  end

  def process_avatar_variants
    return unless avatar.attached?
    return if avatar.content_type == 'image/svg+xml' # SVG doesn't need variants
    
    # Generate all variants to ensure they're ready when needed
    [:xs, :sm, :md, :lg, :xl].each do |size|
      avatar.variant(size).processed
    end
  rescue => e
    Rails.logger.error "Failed to process avatar variants for user #{id}: #{e.message}"
  end
end
