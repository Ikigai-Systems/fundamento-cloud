class CreateSpaces < ActiveRecord::Migration[7.1]
  def change
    create_table :spaces do |t|
      t.json :hierarchy

      t.timestamps
    end
  end
end
