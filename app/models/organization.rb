class Organization < ApplicationRecord
  include NpiOrdering
  include Trashable

  has_many :api_tokens, dependent: :delete_all
  has_many :attachments, dependent: :destroy
  has_many :automations, dependent: :destroy
  has_many :documents, -> { kept }, dependent: nil, inverse_of: :organization
  has_many :all_documents, class_name: "Document", dependent: :destroy, inverse_of: :organization
  has_many :import_sessions, dependent: :destroy
  has_many :invitations, class_name: "DeviseInvitable::Invitation", dependent: :destroy
  has_many :organization_memberships, class_name: :OrganizationMembership, dependent: :destroy
  has_many :public_links, dependent: :destroy
  has_many :spaces, dependent: :destroy
  has_many :tables, -> { kept }, dependent: nil, inverse_of: :organization
  has_many :all_tables, class_name: "Table", dependent: :destroy, inverse_of: :organization
  has_many :tags, dependent: :destroy
  has_many :team_memberships, dependent: :destroy
  has_many :teams, dependent: :destroy
  has_many :users, through: :organization_memberships
  has_many :favorites, through: :organization_memberships, dependent: :destroy

  validates_presence_of :name
  validates :time_zone, inclusion: { in: ->(_) { TZInfo::Timezone.all_identifiers }, message: "is not a valid time zone" }

  after_create :create_default_space

  # The zone formulas evaluate in. Choices for a form: real zones, not the legacy link names.
  def self.time_zone_choices
    (TZInfo::Timezone.all_data_zone_identifiers + ["UTC"]).sort
  end

  # Invitations made before devise_invitations stored the address have none to show or resend; they
  # expire on their own.
  def listed_invitations
    invitations.pending.where.not(email: nil).preload(:invited_by).order(created_at: :desc)
  end

  private

  def create_default_space
    space = self.spaces.create!(name: self.name + " Space")
    space.populate_with_onboarding_content!
  end
end
