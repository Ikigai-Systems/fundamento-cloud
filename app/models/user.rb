class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  self.table_name = :organization_users

  devise :invitable, :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable, :trackable

  validates_presence_of :first_name
  validates_presence_of :last_name

  after_create_commit { broadcast_prepend_to("online_users", target: "online-users") }

  after_destroy_commit { broadcast_remove_to("online_users") }

  def online?
    Rails.cache.fetch("#{cache_key}/online", false)
  end

  def last_online_at
    Rails.cache.fetch("#{cache_key}/last_online_at", nil)
  end

  def change_to_online
    Rails.cache.write("#{cache_key}/last_online_at", Time.now)
    Rails.cache.write("#{cache_key}/online", true)

    broadcast_replace_to("online_users")
    broadcast_replace_to("admin_users_list", partial: "admin/users/user")
  end

  def change_to_offline
    Rails.cache.write("#{cache_key}/online", false)

    broadcast_replace_to("online_users")
    broadcast_replace_to("admin_users_list", partial: "admin/users/user")
  end

  def organizations
    Organization.all
  end
end
