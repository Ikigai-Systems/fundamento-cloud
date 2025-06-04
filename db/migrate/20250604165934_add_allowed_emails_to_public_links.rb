class AddAllowedEmailsToPublicLinks < ActiveRecord::Migration[7.1]
  def change
    add_column :public_links, :allowed_emails, :text, array: true, default: []
  end
end
