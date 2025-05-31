class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable

  devise :invitable, :database_authenticatable, :registerable,
    :recoverable, :rememberable, :validatable, :trackable

  scope :query, ->(query) { where("(first_name || ' ' || last_name) ILIKE ?", "%#{query}%") }

  has_many :organizations_users, class_name: :OrganizationUser, dependent: :destroy
  has_many :organizations, through: :organizations_users
  has_many :public_links, as: :updated_by, dependent: :nullify

  has_many :team_memberships, dependent: :destroy
  has_many :teams, through: :team_memberships, dependent: :destroy

  validates_presence_of :first_name
  validates_presence_of :last_name

  validate :password_complexity, if: :password_required?

  private

  def password_complexity
    return if password.blank?

    errors.add(:password, 'must be at least 8 characters long') if password.length < 8
    errors.add(:password, 'must contain at least one uppercase letter') unless password.match?(/[A-Z]/)
    errors.add(:password, 'must contain at least one lowercase letter') unless password.match?(/[a-z]/)
    errors.add(:password, 'must contain at least one number') unless password.match?(/\d/)
    errors.add(:password, 'must contain at least one special character') unless password.match?(/[!@#$%^&*()_+{}\[\]:;<>,.?~\\|-]/)
  end

  def password_required?
    !persisted? || !password.nil? || !password_confirmation.nil?
  end

  def initials
    first_name.first(1) + last_name.first(1)
  end

  def display_name
    "#{first_name} #{last_name}"
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

  # Do not allow user to reset its password until it accepts the invitation
  # Taken from https://github.com/scambra/devise_invitable/wiki/Disabling-devise-recoverable,-if-invitation-was-not-accepted
  def send_reset_password_instructions
    super if invitation_token.nil?
  end
end
