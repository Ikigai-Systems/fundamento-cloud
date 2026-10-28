# Doorkeeper stores SHA-256 digests of OAuth secrets now. Rows written before that still hold
# plain values, which the plain fallback accepted. This hashes them so the fallback can go.
#
# A digest is 64 lowercase hex characters; Doorkeeper's plain tokens and secrets are url-safe
# base64 and never look like one, so a value in that form is already hashed and left alone.
# That also makes the migration safe to run twice.
class HashPlainOauthSecrets < ActiveRecord::Migration[8.1]
  COLUMNS = {
    oauth_access_grants: %i[token],
    oauth_access_tokens: %i[token refresh_token previous_refresh_token],
    oauth_applications: %i[secret],
  }.freeze

  def up
    COLUMNS.each do |table, columns|
      columns.each do |column|
        execute <<~SQL
          UPDATE #{table}
          SET #{column} = encode(sha256(convert_to(#{column}, 'UTF8')), 'hex')
          WHERE #{column} <> '' AND #{column} !~ '^[0-9a-f]{64}$'
        SQL
      end
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "a digest can't be turned back into the secret"
  end
end
