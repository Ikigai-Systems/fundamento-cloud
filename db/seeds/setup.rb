# db/seeds/setup.rb
# Oaken setup: defaults, helpers, model registrations
# This file is automatically loaded by Oaken before any seed scenarios.

# Register namespaced models that Oaken's auto-resolver can't find
loader.register Tables::Column, as: :tables_columns
loader.register Tables::Row, as: :tables_rows
loader.register Tables::Cell, as: :tables_cells

section :user_defaults do
  users.defaults password: "password"

  # Auto-confirm all seed users (Devise confirmable) and provide unique_by default
  def users.create(label = nil, unique_by: :email, **attrs)
    record = super(label, unique_by: unique_by, **attrs)
    record.confirm unless record.confirmed?
    record
  end
end

section :organization_helpers do
  # Create org without triggering after_create :create_default_space callback
  # which would auto-create a space with onboarding content
  def organizations.create_seed(label = nil, **attrs)
    Organization.skip_callback(:create, :after, :create_default_space)
    result = create(label, **attrs)
    Organization.set_callback(:create, :after, :create_default_space)
    result
  end
end

section :space_helpers do
  # Create space without triggering after_create :create_home_document! callback
  def spaces.create_seed(label = nil, **attrs)
    Space.skip_callback(:create, :after, :create_home_document!)
    result = create(label, **attrs)
    Space.set_callback(:create, :after, :create_home_document!)
    result
  end
end
