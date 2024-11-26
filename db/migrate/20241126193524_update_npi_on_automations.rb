class UpdateNpiOnAutomations < ActiveRecord::Migration[7.1]
  def change
    change_column_default :automations, :npi, from: nil, to: -> { "gen_random_uuid()" }
    change_column_null :automations, :npi, false, -> { "gen_random_uuid()" }
  end
end
