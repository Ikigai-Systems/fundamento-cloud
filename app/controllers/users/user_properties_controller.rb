class Users::UserPropertiesController < ApplicationController
  include EnsureOrganization

  def update
    if params.fetch("user_id") == "myself"
      current_organization_membership.organization_membership_properties.upsert({key: params.fetch("id"), value: params["_json"]}, unique_by: [:key, :organization_membership_id])
    else
      raise NotImplementedError.new
    end
  end
end