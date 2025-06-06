# frozen_string_literal: true

class UserWithEmail < ViewComponent::Base
  erb_template <<-ERB
    <div>
      <div class="text-base font-semibold"><%= @user.display_name %></div>
      <div class="font-normal text-gray-500"><%= @user.email %></div>
    </div>
  ERB

  def initialize(organization_user: nil, user: nil)
    @user = organization_user || user

    assert @user.present?, "You need to pass organization_user or user"
  end
end
