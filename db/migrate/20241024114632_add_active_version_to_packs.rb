class AddActiveVersionToPacks < ActiveRecord::Migration[7.1]
  def change
    add_belongs_to :packs, :active_version, foreign_key: { to_table: :pack_versions }, index: false
  end
end
