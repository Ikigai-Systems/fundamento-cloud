class AddAttributesToInlineComments < ActiveRecord::Migration[7.1]
  def change
    add_column :inline_comments, :comment_attributes, :json, default: ""
  end
end
