# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

if Rails.env.standalone?
  # Code to initialize a standalone server
  unless Organization.exists?
    Organization.create!(
      name: ENV.fetch("FUNDAMENTO_ORGANIZATION", "Acme Inc.")
    )
  end

  unless User.exists?
    User.create!(
      first_name: ENV.fetch("FUNDAMENTO_ADMIN_FIRST_NAME", "Root"),
      last_name: ENV.fetch("FUNDAMENTO_ADMIN_LAST_NAME", "Beloved"),
      email: ENV.fetch("FUNDAMENTO_ADMIN_EMAIL", "root@localhost"),
      password: ENV.fetch("FUNDAMENTO_ADMIN_PASSWORD", "password!"),
    )
  end
end