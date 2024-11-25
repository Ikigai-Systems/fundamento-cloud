class FixObjectTypeInFavorites < ActiveRecord::Migration[7.1]
  def change
    Favorite.where(object_type: "Tables::Table").update_all(object_type: "Table")
  end
end
