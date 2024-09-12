class AddOrganizationIdToSpaceMemberships < ActiveRecord::Migration[7.1]
  def change
    add_belongs_to :space_memberships, :organization, null: false
  end
end
