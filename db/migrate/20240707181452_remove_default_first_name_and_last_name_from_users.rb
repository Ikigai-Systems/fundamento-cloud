class RemoveDefaultFirstNameAndLastNameFromUsers < ActiveRecord::Migration[7.1]
  def change
    change_column_default :organization_users, :first_name, from: "Joe", to: nil
    change_column_default :organization_users, :last_name, from: "Doe", to: nil
  end
end
