# you can delete this file if you don't use Rails Test Fixtures

fixtures_dir = command_options.try(:[], 'fixtures_dir')
fixture_files = command_options.try(:[], 'fixtures')

if defined?(ActiveRecord)
  require "active_record/fixtures"

  fixtures_dir ||= ActiveRecord::Tasks::DatabaseTasks.fixtures_path
  fixture_files ||= Dir["#{fixtures_dir}/**/*.yml"].map { |f| f[(fixtures_dir.size + 1)..-5] }

  logger.debug "loading fixtures: { dir: #{fixtures_dir}, files: #{fixture_files} }"
  ActiveRecord::FixtureSet.reset_cache
  ActiveRecord::FixtureSet.create_fixtures(fixtures_dir, fixture_files)

  # Sync space hierarchies with loaded documents and tables.
  # Fixtures bypass model callbacks, so documents/tables won't be added
  # to their space's hierarchy automatically. This rebuilds it.
  Space.find_each do |space|
    hierarchy = Document.where(space_id: space.id).order(:created_at).map { |d| space.create_hierarchy_node(d.id) }
    # hierarchy += Table.where(space_id: space.id).order(:created_at).map { |t| space.create_hierarchy_node(t.id) }
    space.update_column(:hierarchy, hierarchy) if hierarchy.any?
  end

  "Fixtures Done" # this gets returned
else # this else part can be removed
  logger.error "Looks like activerecord_fixtures has to be modified to suite your need"
  Post.create(title: 'MyCypressFixtures')
  Post.create(title: 'MyCypressFixtures2')
  Post.create(title: 'MyRailsFixtures')
  Post.create(title: 'MyRailsFixtures2')
end
