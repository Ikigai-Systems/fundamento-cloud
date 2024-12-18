class OrganizationUser < ApplicationRecord
  scope :query, ->(query) { joins(:user).where("(users.first_name || ' ' || users.last_name) ILIKE ?", "%#{query}%") }

  include ModelWithNpiAsParam

  belongs_to :organization
  belongs_to :user

  has_many :api_tokens, dependent: :delete_all
  has_many :favorites

  enum :role, [:manager, :member], scope: false

  delegate :display_name, to: :user

  delegate :email, :email=, to: :user
  # delegate :first_name, :first_name=, to: :user
  # delegate :last_name, :last_name=, to: :user
  # delegate :password, :password=, to: :user
  # delegate :password_confirmation, :password_confirmation=, to: :user

  accepts_nested_attributes_for :user, allow_destroy: false

  after_create_commit do
    broadcast_refresh_to(
      ["organization_users_list", self.organization]
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
      ["organization_users_list", self.organization]
    )
  end

  after_destroy_commit do
    broadcast_remove_to(
      ["organization_users_list", self.organization],
      target: self.user
    )

    broadcast_remove_to(
      ["organizations_list", self.user],
      target: self.organization
    )
  end
end