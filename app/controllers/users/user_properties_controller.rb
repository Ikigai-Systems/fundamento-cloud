class Users::UserPropertiesController < ApplicationController
  def update
    if params.fetch("user_id") == "myself"
      current_organization_user.organization_user_properties.upsert({key: params.fetch("id"), value: params["_json"]}, unique_by: [:key, :organization_user_id])
    else
      raise NotImplementedError.new
    end
  end
end