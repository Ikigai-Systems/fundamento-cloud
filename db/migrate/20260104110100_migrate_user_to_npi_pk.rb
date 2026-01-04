class MigrateUserToNpiPk < ActiveRecord::Migration[8.1]
  def up
    # List of all tables with FK to users
    tables_with_user_fk = [
      { table: :organization_users, column: :user_id },
      { table: :object_visitors, column: :user_id },
      { table: :versions, column: :created_by_id },
      { table: :inline_comments, column: :user_id }
    ]

    # Step 0: Drop foreign key constraints from child tables to users (if any exist)
    tables_with_user_fk.each do |config|
      table = config[:table]
      column = config[:column]
      if foreign_key_exists?(table, :users, column: column)
        remove_foreign_key table, :users, column: column
      end
    end

    # Step 1: Change FK columns from bigint to string
    tables_with_user_fk.each do |config|
      change_column config[:table], config[:column], :string
    end

    # Step 2: Update FK columns to use NPIs
    tables_with_user_fk.each do |config|
      table = config[:table]
      column = config[:column]
      execute <<-SQL
        UPDATE #{table}
        SET #{column} = users.npi
        FROM users
        WHERE #{table}.#{column}::text = users.id::text
      SQL
    end

    # Step 3: Drop the old id column (drops PK constraint automatically)
    remove_column :users, :id

    # Step 4: Rename npi column to id
    rename_column :users, :npi, :id

    # Step 5: Add primary key constraint on id
    execute "ALTER TABLE users ADD PRIMARY KEY (id)"

    # Step 6: Re-add foreign key constraints
    tables_with_user_fk.each do |config|
      add_foreign_key config[:table], :users, column: config[:column]
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Cannot safely reverse NPI primary key migration for users"
  end
end
