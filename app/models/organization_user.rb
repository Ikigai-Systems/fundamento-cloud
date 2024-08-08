class OrganizationUser < ApplicationRecord
  self.table_name = :organizations_users
  self.primary_key = [:organization_id, :user_id]

  belongs_to :organization
  belongs_to :user

  after_create_commit do
    broadcast_append_to(
      ["admin_users_list", self.organization],
      target: "users",
      partial: "admin/users/user",
      locals: {
        current_organization: self.organization,
        user: self.user
      }
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

  after_destroy_commit do
    broadcast_remove_to(
      ["admin_users_list", self.organization],
      target: self.user
    )

    broadcast_remove_to(
      ["organizations_list", self.user],
      target: self.organization
    )
  end
end