# A counter that moves every time the Yjs state is written, for a client to say which state it
# read. A timestamp can't do that job: a JSON response rounds it to milliseconds, so a value
# sent back never matches the stored one. Same idea as spaces.hierarchy_version.
class AddSyncVersionToObjectContents < ActiveRecord::Migration[8.1]
  def change
    add_column :object_contents, :sync_version, :integer, default: 0, null: false
  end
end
