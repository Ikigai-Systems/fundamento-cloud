class ApiToken < ApplicationRecord
  belongs_to :organization
  belongs_to :organization_membership

  encrypts :encrypted_token, deterministic: true

  before_validation :ensure_has_encrypted_token, on: :create

  validates_presence_of :title

  def generate_api_token
    self.encrypted_token = SecureRandom.hex(32)
  end

  def ensure_has_encrypted_token
    generate_api_token if self.encrypted_token.blank?
  end
end