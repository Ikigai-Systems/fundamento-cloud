# Phase 2 of the devise_invitable 3 move: invitations live in devise_invitations now, so the
# invited_users table and the gem's old columns on users are unused. They went unread in the
# release before this one, which is why they are dropped separately from the code change.
class DropLegacyInvitationStructures < ActiveRecord::Migration[8.1]
  def change
    drop_table :invited_users, id: :string, default: -> { "gen_random_uuid()" } do |t|
      t.string :email, default: "", null: false
      t.string :encrypted_password, default: "", null: false
      t.text :first_name, default: "", null: false
      t.text :last_name, default: "", null: false
      t.string :organization_id
      t.string :invitation_token
      t.datetime :invitation_created_at
      t.datetime :invitation_sent_at
      t.datetime :invitation_accepted_at
      t.integer :invitation_limit
      t.integer :invitations_count, default: 0
      t.string :invited_by_id
      t.string :invited_by_type
      t.timestamps

      t.index [:email, :organization_id], unique: true
      t.index :id, unique: true
      t.index :invitation_token, unique: true
      t.index :invited_by_id
      t.index [:invited_by_type, :invited_by_id], name: "index_invited_users_on_invited_by"
      t.index :organization_id
      t.foreign_key :organizations
    end

    remove_index :users, :invitation_token, unique: true
    remove_index :users, :invited_by_id
    remove_index :users, [:invited_by_type, :invited_by_id], name: "index_organization_users_on_invited_by"

    change_table :users, bulk: true do |t|
      t.remove :invitation_token, type: :string
      t.remove :invitation_created_at, type: :datetime
      t.remove :invitation_sent_at, type: :datetime
      t.remove :invitation_accepted_at, type: :datetime
      t.remove :invitation_limit, type: :integer
      t.remove :invitations_count, type: :integer, default: 0
      t.remove :invited_by_id, type: :bigint
      t.remove :invited_by_type, type: :string
    end
  end
end
