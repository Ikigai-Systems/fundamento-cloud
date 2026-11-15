# The gem keeps only a digest of the invited address, which is enough to accept an invitation but not
# to list it or send it again. The organization's pending-invitations list needs the address itself.
class AddEmailToDeviseInvitations < ActiveRecord::Migration[8.1]
  def change
    add_column :devise_invitations, :email, :string
  end
end
