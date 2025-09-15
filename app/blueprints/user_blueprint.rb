class UserBlueprint < Blueprinter::Base
  identifier :id

  fields :first_name, :last_name, :created_at, :updated_at

  view :formula do
  end
end