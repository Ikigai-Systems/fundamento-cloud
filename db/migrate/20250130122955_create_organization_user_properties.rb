class CreateOrganizationUserProperties < ActiveRecord::Migration[7.1]
  def change
    create_table :organization_user_properties do |t|
      t.belongs_to :organization_user, null: false, foreign_key: true

      t.string :key, null: false
      t.jsonb :value, null: false

      t.index [:key, :organization_user_id], unique: true

      t.timestamps
    end
  end
end
