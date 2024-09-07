class CreateSpaceManagers < ActiveRecord::Migration[7.1]
  def change
    create_table :space_managers do |t|
      t.belongs_to :space
      t.belongs_to :manager, polymorphic: true

      t.index [:manager_id, :manager_type, :space_id], unique: true
    end
  end
end
