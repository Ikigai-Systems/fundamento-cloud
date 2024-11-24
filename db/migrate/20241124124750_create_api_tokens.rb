class CreateApiTokens < ActiveRecord::Migration[7.1]
  def change
    create_table :api_tokens do |t|
      t.belongs_to :organization, foreign_key: true
      t.belongs_to :organization_user, foreign_key: true

      t.string :title, null: false, default: ""
      t.string :encrypted_token, null: false
      t.datetime :used_at

      t.timestamps

      t.index [:encrypted_token], unique: true
    end
  end
end
