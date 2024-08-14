class ChangeDefaultsOnInvitedUsers < ActiveRecord::Migration[7.1]
  def change
    change_column_default :invited_users, :first_name, ""
    change_column_default :invited_users, :last_name, ""
  end
end
