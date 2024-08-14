# frozen_string_literal: true

class DeviseCreateInvitedUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :invited_users do |t|
      t.belongs_to :organization, foreign_key: true

      ## Database authenticatable
      t.string :email, null: false, default: ""
      t.string :encrypted_password, null: false, default: ""

      t.timestamps null: false

      ## Invitable
      t.string     :invitation_token
      t.datetime   :invitation_created_at
      t.datetime   :invitation_sent_at
      t.datetime   :invitation_accepted_at
      t.integer    :invitation_limit
      t.references :invited_by, polymorphic: true
      t.integer    :invitations_count, default: 0
      t.index      :invitation_token, unique: true # for invitable
      t.index      :invited_by_id
    end

    add_index :invited_users, [:email, :organization_id], unique: true
  end
end
