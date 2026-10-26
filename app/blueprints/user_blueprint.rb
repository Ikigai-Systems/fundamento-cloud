class UserBlueprint < Blueprinter::Base
  identifier :id

  fields :first_name, :last_name, :created_at, :updated_at

  view :formula do
    fields :display_name do |user|
      "#{first_name} #{last_name}"
    end
  end

  # What React needs to draw a user the way the UserAvatar component does: the
  # uploaded picture, or initials from the display name (which falls back to
  # the email).
  view :with_avatar do
    field :display_name

    field :avatar_url do |user|
      Rails.application.routes.url_helpers.polymorphic_url(user.avatar_variant(:md), only_path: true) if user.avatar.attached?
    end
  end
end
