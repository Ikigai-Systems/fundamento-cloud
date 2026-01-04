class AddNpiToInvitedUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :invited_users, :npi, :string, default: -> { "gen_random_uuid()" }, null: false
    add_index :invited_users, :npi, unique: true
  end
end
