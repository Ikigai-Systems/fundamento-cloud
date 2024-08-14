class AddFirstNameAndLastNameToInvitedUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :invited_users, :first_name, :text, null: false, default: "Joe"
    add_column :invited_users, :last_name, :text, null: false, default: "Doe"
  end
end
