class CreateVersions < ActiveRecord::Migration[7.1]
  def change
    create_table :versions do |t|
      t.json :content
      t.belongs_to :document, null: false, foreign_key: true

      t.timestamps
    end
  end
end
