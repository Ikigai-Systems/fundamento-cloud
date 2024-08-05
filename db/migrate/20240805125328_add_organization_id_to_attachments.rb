class AddOrganizationIdToAttachments < ActiveRecord::Migration[7.1]
  def change
    add_belongs_to :attachments, :organization, foreign_key: true, null: true
  end
end
