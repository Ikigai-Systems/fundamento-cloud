class AddRedditClickIdToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :reddit_click_id, :string
  end
end
