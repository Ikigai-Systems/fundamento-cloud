class AddLastUsedAtToOauthAccessTokens < ActiveRecord::Migration[8.1]
  def change
    add_column :oauth_access_tokens, :used_at, :datetime
  end
end
