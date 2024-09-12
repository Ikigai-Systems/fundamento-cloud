class CreateOrganizationUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :organization_users do |t|
      t.belongs_to :organization
      t.belongs_to :user

      t.integer :role, limit: 2, null: false, default: 0

      t.string :npi, null: false, default: -> { "gen_random_uuid()" }

      t.timestamps

      t.index :npi, unique: true
    end
  end
end
