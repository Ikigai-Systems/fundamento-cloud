class AddNpiToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :npi, :string, default: -> { "gen_random_uuid()" }, null: false
    add_index :users, :npi, unique: true
  end
end
