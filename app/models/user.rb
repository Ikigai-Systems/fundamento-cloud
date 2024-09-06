class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable

  devise :invitable, :database_authenticatable, :registerable,
    :recoverable, :rememberable, :validatable, :trackable

  has_many :organizations_users, class_name: :OrganizationUser, dependent: :destroy
  has_many :organizations, through: :organizations_users
  has_many :public_links, as: :updated_by, dependent: :nullify

  has_many :team_memberships, dependent: :destroy
  has_many :teams, through: :team_memberships, dependent: :destroy

  validates_presence_of :first_name
  validates_presence_of :last_name

  def initials
    first_name.first(1) + last_name.first(1)
  end

  def display_name
    "#{first_name} #{last_name}"
  end

  def online?(for_organization)
    Rails.cache.fetch("#{for_organization.cache_key}/#{cache_key}/online", false)
  end

  def last_online_at(for_organization)
    Rails.cache.fetch("#{for_organization.cache_key}/#{cache_key}/last_online_at", nil)
  end

  def change_to_online(for_organization)
    Rails.cache.write("#{for_organization.cache_key}/#{cache_key}/last_online_at", Time.now)
    Rails.cache.write("#{for_organization.cache_key}/#{cache_key}/online", true)

    broadcast_replace_to(["admin_users_list", for_organization],
      partial: "admin/users/user",
      locals: { current_organization: for_organization })
  end

  def change_to_offline(for_organization)
    Rails.cache.write("#{for_organization.cache_key}/#{cache_key}/online", false)

    broadcast_replace_to(["admin_users_list", for_organization],
      partial: "admin/users/user",
      locals: { current_organization: for_organization }
    )
  end

  # Do not allow user to reset its password until it accepts the invitation
  # Taken from https://github.com/scambra/devise_invitable/wiki/Disabling-devise-recoverable,-if-invitation-was-not-accepted
  def send_reset_password_instructions
    super if invitation_token.nil?
  end
end
