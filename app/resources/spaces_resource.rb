# frozen_string_literal: true

class SpacesResource < ApplicationResource
  uri "fundamento/spaces"
  resource_name "Spaces"
  description "Lists spaces you have access to in the current organization"
  mime_type "application/json"

  def content
    JSON.generate(Space.all.as_json)
  end
end
