class OrganizationUser < ApplicationRecord
  self.table_name = :organizations_users
  self.primary_key = [:organization_id, :user_id]

  belongs_to :organization
  belongs_to :user

  enum :role, [:manager, :member], scope: false

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

  def to_param
    "#{organization_id},#{user_id}"
  end
end