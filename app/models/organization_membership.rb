class OrganizationMembership < ApplicationRecord
  include NpiOrdering

  scope :query, ->(query) { joins(:user).merge(User.query(query)) }

  belongs_to :organization
  belongs_to :user

  has_many :api_tokens, dependent: :delete_all
  has_many :favorites, dependent: :delete_all
  has_many :reactions, class_name: "ObjectReaction", dependent: :delete_all
  has_many :automations, inverse_of: :run_as
  has_many :automation_invocations, inverse_of: :run_as
  has_many :organization_membership_properties, dependent: :delete_all
  has_many :import_sessions, dependent: :destroy
  has_many :team_memberships, inverse_of: :member, dependent: :delete_all
  has_many :space_memberships, inverse_of: :member, dependent: :delete_all
  has_many :editing_sessions, class_name: "DocumentEditingSession", foreign_key: :member_id, inverse_of: :member, dependent: :delete_all

  enum :role, [:manager, :member], scope: false

  delegate :display_name, to: :user
  delegate :initials, to: :user

  delegate :email, :email=, to: :user
  delegate :first_name, :first_name=, to: :user
  delegate :last_name, :last_name=, to: :user
  # delegate :password, :password=, to: :user
  # delegate :password_confirmation, :password_confirmation=, to: :user

  accepts_nested_attributes_for :user, allow_destroy: false

  after_create_commit do
    broadcast_refresh_to(
      ["organization_memberships_list", self.organization]
    )

    broadcast_append_to(
      ["organizations_list", self.user],
      target: "organizations",
      partial: "organizations/organization",
      locals: {
        organization: self.organization
      }
    )
  end

  after_update_commit do
    broadcast_refresh_to(
      ["organization_memberships_list", self.organization]
    )
  end

  after_destroy_commit do
    broadcast_remove_to(
      ["organization_memberships_list", self.organization],
      target: self.user
    )

    broadcast_remove_to(
      ["organizations_list", self.user],
      target: self.organization
    )
  end

  def unread_mentions_count(documents)
    last_mention_seen_at = self.organization_membership_properties.find_by_key("last_mention_seen_at")&.value&.to_datetime

    MentionsExtractor::get_all_mentions(documents, self.user)
      .filter{ |mention| last_mention_seen_at.present? ? mention.created_at > last_mention_seen_at : true}
      .count
  end

  def online?
    self.user.online?(self.organization)
  end
end