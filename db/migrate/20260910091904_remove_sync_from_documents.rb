# Release 2 of two. CreateObjectContents copied the Y.js blob into object_contents and
# put this column on ignored_columns; nothing has read or written it since.
#
# Only safe once that release is fully rolled out -- a container still running the
# previous code writes here on every keystroke, and dropping the column mid-drain would
# break it.
class RemoveSyncFromDocuments < ActiveRecord::Migration[8.1]
  def change
    remove_column :documents, :sync, :binary
  end
end
