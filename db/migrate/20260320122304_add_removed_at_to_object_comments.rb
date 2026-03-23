class AddRemovedAtToObjectComments < ActiveRecord::Migration[8.1]
  def change
    add_column :object_comments, :removed_at, :datetime
  end
end
