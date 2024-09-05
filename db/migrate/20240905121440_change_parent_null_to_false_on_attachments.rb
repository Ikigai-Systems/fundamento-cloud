class ChangeParentNullToFalseOnAttachments < ActiveRecord::Migration[7.1]
  def change
    change_column_null :attachments, :parent_id, false
    change_column_null :attachments, :parent_type, false
  end
end
