class CreateUserIdentities < ActiveRecord::Migration[8.1]
  def change
    create_table :user_identities, id: :string, default: -> { "gen_random_uuid()" } do |t|
      t.string :user_id, null: false
      t.string :provider, null: false
      t.string :uid, null: false
      t.string :email
      t.string :name
      t.jsonb :token_data

      t.timestamps
    end

    add_index :user_identities, :user_id
    add_index :user_identities, [:provider, :uid], unique: true
    add_foreign_key :user_identities, :users
  end
end
