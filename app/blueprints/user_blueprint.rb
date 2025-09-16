class UserBlueprint < Blueprinter::Base
  identifier :id

  fields :first_name, :last_name, :created_at, :updated_at

  view :formula do
    fields :display_name do |user|
      "#{first_name} #{last_name}"
    end
  end
end