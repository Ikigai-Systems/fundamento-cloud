# db/seeds.rb

# Standalone mode seeding (production/self-hosted)
if Flipper.enabled?(:standalone)
  DatabaseId.upsert(ActiveRecord::Base.connection)

  organization = Organization.find_or_create_by!(
    name: ENV.fetch("FUNDAMENTO_ORGANIZATION", "Acme Inc.")
  )

  administrator = User.find_or_create_by!(email: ENV.fetch("FUNDAMENTO_ADMIN_EMAIL", "root@localhost")) do |user|
    user.first_name = ENV.fetch("FUNDAMENTO_ADMIN_FIRST_NAME", "Root")
    user.last_name = ENV.fetch("FUNDAMENTO_ADMIN_LAST_NAME", "Beloved")
    user.password = ENV.fetch("FUNDAMENTO_ADMIN_PASSWORD", "password!")
  end

  organization.organization_memberships.find_or_create_by!(user: administrator)
  return
end

# Development seed data
return unless Rails.env.development?

Oaken.seed :organizations
