class OnlineUsersTracker
  def self.online?(for_organization, user)
    Rails.cache.fetch("#{for_organization.cache_key}/#{user.cache_key}/online", false)
  end

  def self.last_online_at(for_organization, user)
    Rails.cache.fetch("#{for_organization.cache_key}/#{user.cache_key}/last_online_at", nil)
  end

  def self.change_to_online(for_organization, user)
    Rails.cache.write("#{for_organization.cache_key}/#{user.cache_key}/last_online_at", Time.now)
    Rails.cache.write("#{for_organization.cache_key}/#{user.cache_key}/online", true)

    Turbo::StreamsChannel.broadcast_replace_to(["organization_stream", for_organization],
      target: [user, "online_status"],
      partial: "users/online_status",
      locals: {
        current_organization: for_organization,
        user: user,
      })

    add_to_online_users(for_organization, user)
  end

  def self.change_to_offline(for_organization, user)
    Rails.cache.write("#{for_organization.cache_key}/#{user.cache_key}/online", false)

    Turbo::StreamsChannel.broadcast_replace_to(["organization_stream", for_organization],
      target: [user, "online_status"],
      partial: "users/online_status",
      locals: {
        current_organization: for_organization,
        user: user,
      }
    )

    remove_from_online_users(for_organization, user)
  end

  def self.all_online_user_ids(for_organization = nil)
    with_redis do |redis|
      if for_organization.present?
        redis.smembers(redis_key(for_organization))
      else
        all_online_users = Set.new

        redis.scan_each(match: redis_key(nil) + "*", type: "set") do |redis_key|
          all_online_users.merge(redis.smembers(redis_key))
        end

        all_online_users.to_a
      end
    end
  end

  def self.all_online_users(for_organization = nil)
    User.where(id: all_online_user_ids(for_organization))
  end

  protected

  def self.add_to_online_users(for_organization, user)
    with_redis do |redis|
      redis.sadd(redis_key(for_organization), user.id)
    end
  end

  def self.remove_from_online_users(for_organization, user)
    with_redis do |redis|
      redis.srem(redis_key(for_organization), user.id)
    end
  end

  def self.redis_key(for_organization = nil)
    "online_users/#{for_organization&.cache_key}"
  end

  def self.with_redis(&block)
    Rails.cache.redis.with do |redis|
      block.call(redis)
    end
  end
end