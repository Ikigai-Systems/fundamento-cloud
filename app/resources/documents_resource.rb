# frozen_string_literal: true

class DocumentsResource < ApplicationResource
  uri "fundamento/{space_npi}/documents"
  resource_name "Documents"
  description "Lists documents you have access to in the specified space"
  mime_type "application/json"

  def content
    JSON.generate(Document.all.as_json)
  end
end
