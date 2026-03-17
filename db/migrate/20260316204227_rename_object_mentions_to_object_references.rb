class RenameObjectMentionsToObjectReferences < ActiveRecord::Migration[8.1]
  def change
    rename_table :object_mentions, :object_references
  end
end
