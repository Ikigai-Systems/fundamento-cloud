class DatabaseId
  def self.get(connection)
    ActiveRecord::InternalMetadata.new(connection)[:database_id] || "666"
  end
end