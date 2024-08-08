class OnlineUsersChannel < ApplicationCable::Channel

  def subscribed
    current_user&.change_to_online(current_organization)
    super
  end

  def unsubscribed
    current_user&.change_to_offline(current_organization)
    super
  end
end