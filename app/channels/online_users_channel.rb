class OnlineUsersChannel < ApplicationCable::Channel

  def subscribed
    current_user&.change_to_online
    super
  end

  def unsubscribed
    current_user&.change_to_offline
    super
  end
end