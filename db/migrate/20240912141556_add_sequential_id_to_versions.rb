class AddSequentialIdToVersions < ActiveRecord::Migration[7.1]
  def change
    add_column :versions, :sequential_id, :integer

    execute <<~SQL
    UPDATE versions
    SET sequential_id = old_versions.next_sequential_id
    FROM (
      SELECT id, ROW_NUMBER()
      OVER(
        PARTITION BY document_id
        ORDER BY id
      ) AS next_sequential_id
      FROM versions
    ) old_versions
    WHERE versions.id = old_versions.id
  SQL

    change_column :versions, :sequential_id, :integer, null: false
    add_index :versions, [:sequential_id, :document_id], unique: true
  end
end
