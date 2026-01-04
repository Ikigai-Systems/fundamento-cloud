class OrganizationBlueprint < Blueprinter::Base
  identifier :id

  fields :name, :created_at, :updated_at

  view :formula do
  end
end