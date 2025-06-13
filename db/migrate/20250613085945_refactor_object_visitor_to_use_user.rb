class RefactorObjectVisitorToUseUser < ActiveRecord::Migration[7.1]
  def up
    # Add user_id column
    add_column :object_visitors, :user_id, :bigint
    add_index :object_visitors, :user_id
    
    # Populate user_id from organization_user relationship
    execute <<-SQL
      UPDATE object_visitors 
      SET user_id = organization_users.user_id 
      FROM organization_users 
      WHERE object_visitors.organization_user_id = organization_users.id
    SQL
    
    # Make user_id not null after populating data
    change_column_null :object_visitors, :user_id, false
    
    # Remove old index and add new one
    remove_index :object_visitors, name: "idx_on_object_id_object_type_organization_user_id_90310b8bdb"
    add_index :object_visitors, [:object_id, :object_type, :user_id], unique: true, name: "idx_on_object_id_object_type_user_id"
    
    # Remove organization_user_id column and its index
    remove_index :object_visitors, :organization_user_id
    remove_column :object_visitors, :organization_user_id
  end
  
  def down
    # Add back organization_user_id column
    add_column :object_visitors, :organization_user_id, :bigint
    add_index :object_visitors, :organization_user_id
    
    # This down migration is complex because we need to determine which organization
    # the user belongs to for each object_visitor record. This assumes the user
    # has only one organization or we take the first one.
    execute <<-SQL
      UPDATE object_visitors 
      SET organization_user_id = organization_users.id 
      FROM organization_users 
      WHERE object_visitors.user_id = organization_users.user_id
      AND organization_users.id = (
        SELECT MIN(id) FROM organization_users ou2 
        WHERE ou2.user_id = organization_users.user_id
      )
    SQL
    
    # Make organization_user_id not null
    change_column_null :object_visitors, :organization_user_id, false
    
    # Remove new index and add back old one
    remove_index :object_visitors, name: "idx_on_object_id_object_type_user_id"
    add_index :object_visitors, [:object_id, :object_type, :organization_user_id], unique: true, name: "idx_on_object_id_object_type_organization_user_id_90310b8bdb"
    
    # Remove user_id column and its index
    remove_index :object_visitors, :user_id
    remove_column :object_visitors, :user_id
  end
end
