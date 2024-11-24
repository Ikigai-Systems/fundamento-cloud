class ApiToken < ApplicationRecord
  belongs_to :organization
  belongs_to :organization_user

  encrypts :encrypted_token, deterministic: true

  def generate_api_token
    self.encrypted_token = SecureRandom.hex(32)
  end
end