class Organization < ApplicationRecord
  include ModelWithNpiAsParam

  has_many :api_tokens, dependent: :delete_all
  has_many :attachments, dependent: :destroy
  has_many :automations, dependent: :destroy
  has_many :documents, dependent: :destroy
  has_many :favorites, dependent: :destroy
  has_many :invited_users, dependent: :destroy
  has_many :organization_users, class_name: :OrganizationUser, dependent: :destroy
  has_many :packs, dependent: :destroy
  has_many :public_links, dependent: :destroy
  has_many :spaces, dependent: :destroy
  has_many :tables, dependent: :destroy
  has_many :team_memberships, dependent: :destroy
  has_many :teams, dependent: :destroy
  has_many :users, through: :organization_users

  validates_presence_of :name

  after_create :create_default_space

  private

  def create_default_space
    self.spaces.create!(name: self.name + " Space")
  end
end
