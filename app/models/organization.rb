class Organization < ApplicationRecord
  include NpiOrdering

  has_many :api_tokens, dependent: :delete_all
  has_many :attachments, dependent: :destroy
  has_many :automations, dependent: :destroy
  has_many :documents, dependent: :destroy
  has_many :document_imports, dependent: :destroy
  has_many :invited_users, dependent: :destroy
  has_many :organization_memberships, class_name: :OrganizationMembership, dependent: :destroy
  has_many :packs, dependent: :destroy
  has_many :public_links, dependent: :destroy
  has_many :spaces, dependent: :destroy
  has_many :tables, dependent: :destroy
  has_many :tags, dependent: :destroy
  has_many :team_memberships, dependent: :destroy
  has_many :teams, dependent: :destroy
  has_many :users, through: :organization_memberships
  has_many :favorites, through: :organization_memberships, dependent: :destroy

  validates_presence_of :name

  after_create :create_default_space

  private

  def create_default_space
    space = self.spaces.create!(name: self.name + " Space")
    space.populate_with_onboarding_content!
  end
end
