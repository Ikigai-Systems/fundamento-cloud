class OrganizationUser < ApplicationRecord
  scope :query, ->(query) { joins(:user).where("(users.first_name || ' ' || users.last_name) ILIKE ?", "%#{query}%") }

  include ModelWithNpiAsParam

  belongs_to :organization
  belongs_to :user

  has_many :favorites

  enum :role, [:manager, :member], scope: false

  delegate :display_name, to: :user

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