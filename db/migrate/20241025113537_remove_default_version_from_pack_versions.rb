class RemoveDefaultVersionFromPackVersions < ActiveRecord::Migration[7.1]
  def change
    change_column_default :pack_versions, :version, from: 1, to: nil
  end
end
