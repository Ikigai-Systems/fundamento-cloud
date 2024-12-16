class AddApprovalFieldsToSupermen < ActiveRecord::Migration[7.1]
  def change
    add_column :supermen, :approved_at, :datetime
    add_belongs_to :supermen, :approved_by
  end
end
