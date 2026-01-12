class MakeDocumentImportsOrganizationUserIdNullable < ActiveRecord::Migration[8.1]
  def up
    change_column_null :document_imports, :organization_user_id, true
  end

  def down
    # NOTE: This will fail if any NULL values exist in organization_user_id
    # You'll need to clean up NULL values before rolling back:
    # DocumentImport.where(organization_user_id: nil).delete_all
    change_column_null :document_imports, :organization_user_id, false
  end
end
