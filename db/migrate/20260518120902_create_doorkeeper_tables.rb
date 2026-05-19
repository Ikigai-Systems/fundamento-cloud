# frozen_string_literal: true

class CreateDoorkeeperTables < ActiveRecord::Migration[8.1]
  def change
    create_table :oauth_applications do |t|
      t.string  :name,         null: false
      t.string  :uid,          null: false
      t.string  :secret,       null: false
      t.text    :redirect_uri, null: false
      t.string  :scopes,       null: false, default: ""
      t.boolean :confidential, null: false, default: true
      t.timestamps             null: false
    end

    add_index :oauth_applications, :uid, unique: true

    create_table :oauth_access_grants do |t|
      # String FK to match users.id (UUID-based string PK)
      t.string   :resource_owner_id,         null: false
      t.references :application,             null: false
      t.string   :token,                     null: false
      t.integer  :expires_in,                null: false
      t.text     :redirect_uri,              null: false
      t.string   :scopes,                    null: false, default: ""
      t.string   :organization_membership_id
      t.datetime :created_at,                null: false
      t.datetime :revoked_at
    end

    add_index :oauth_access_grants, :token, unique: true
    add_index :oauth_access_grants, :organization_membership_id
    add_foreign_key :oauth_access_grants, :oauth_applications, column: :application_id

    create_table :oauth_access_tokens do |t|
      # String FK to match users.id (UUID-based string PK)
      t.string   :resource_owner_id
      t.references :application, null: false

      t.string   :token,                     null: false
      t.string   :refresh_token
      t.integer  :expires_in
      t.string   :scopes
      t.string   :organization_membership_id
      t.datetime :created_at,                null: false
      t.datetime :revoked_at
      t.string   :previous_refresh_token, null: false, default: ""
    end

    add_index :oauth_access_tokens, :token, unique: true
    add_index :oauth_access_tokens, :refresh_token, unique: true,
      where: "refresh_token IS NOT NULL"
    add_index :oauth_access_tokens, :resource_owner_id
    add_index :oauth_access_tokens, :organization_membership_id
    add_foreign_key :oauth_access_tokens, :oauth_applications, column: :application_id
  end
end
