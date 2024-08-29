class CreatePublicLinks < ActiveRecord::Migration[7.1]
  def change
    create_table :public_links do |t|
      t.belongs_to :organization, null: false

      t.belongs_to :object, polymorphic: true, null: false

      t.string :npi, null: false

      t.index [:npi], unique: true

      t.index [:object_id, :object_type, :organization_id], unique: true

      t.belongs_to :updated_by, null: false

      t.timestamps
    end
  end
end
