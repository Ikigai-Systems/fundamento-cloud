class OrganizationBlueprint < Blueprinter::Base
  identifier :npi

  fields :name, :created_at, :updated_at

  view :formula do
  end
end