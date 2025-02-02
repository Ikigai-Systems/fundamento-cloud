class RenameIdToEntityIdInMentions < ActiveRecord::Migration[7.1]
  def change
    up_only do
      Rake::Task['versions:rename_mentions_id_to_entity_id'].invoke
    end
  end
end
