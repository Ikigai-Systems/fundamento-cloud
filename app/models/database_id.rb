class DatabaseId
  def self.get(connection)
    ActiveRecord::InternalMetadata.new(connection)[:database_id] || "666"
  end

  def self.upsert(connection)
    internal_metadata = ActiveRecord::InternalMetadata.new(connection)

    if (database_id = internal_metadata[:database_id]).blank?
      internal_metadata[:database_id] = Nanoid.generate(size: 10)
    else
      database_id
    end
  end
end