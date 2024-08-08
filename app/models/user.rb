class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable

  devise :invitable, :database_authenticatable, :registerable,
    :recoverable, :rememberable, :validatable, :trackable

  has_many :organizations_users, class_name: :OrganizationUser
  has_many :organizations, through: :organizations_users

  validates_presence_of :first_name
  validates_presence_of :last_name

  after_create_commit { broadcast_prepend_to("online_users", target: "online-users") }

  after_destroy_commit { broadcast_remove_to("online_users") }

  def initials
    first_name.first(1) + last_name.first(1)
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

    broadcast_replace_to("online_users")
    broadcast_replace_to(["admin_users_list", for_organization],
      partial: "admin/users/user",
      locals: { current_organization: for_organization })
  end

  def change_to_offline(for_organization)
    Rails.cache.write("#{for_organization.cache_key}/#{cache_key}/online", false)

    broadcast_replace_to("online_users")
    broadcast_replace_to(["admin_users_list", for_organization],
      partial: "admin/users/user",
      locals: { current_organization: for_organization }
    )
  end
end
