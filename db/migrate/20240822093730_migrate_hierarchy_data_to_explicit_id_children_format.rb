class MigrateHierarchyDataToExplicitIdChildrenFormat < ActiveRecord::Migration[7.1]
  def up
    Space.all.each { |space| space.fix_hierarchy_to_most_recent_format }
  end
end
