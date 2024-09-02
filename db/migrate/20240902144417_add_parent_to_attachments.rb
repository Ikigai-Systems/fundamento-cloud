class AddParentToAttachments < ActiveRecord::Migration[7.1]
  def change
    add_belongs_to :attachments, :parent, polymorphic: true, null: true
  end
end
