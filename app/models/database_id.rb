class DatabaseId
  def self.get(connection)
    ActiveRecord::InternalMetadata.new(connection.pool)[:database_id] || "666"
  end

  # Invalidates every browser's cached copy of every document.
  #
  # The editor persists each document's Yjs state to IndexedDB under
  # `databases/<database_id>/documents/<document_id>` (see Editor.tsx), so changing this id
  # makes every client load fresh from the server rather than merging what it already holds.
  #
  # Anything that rewrites stored document content has to do this. Yjs merges rather than
  # replaces, so a client with a cached copy of the old content would fold it straight back in
  # -- which is how a rewrite of embedded ids would quietly undo itself.
  def self.rotate!(connection)
    ActiveRecord::InternalMetadata.new(connection.pool)[:database_id] = Nanoid.generate(size: 10)
  end

  def self.upsert(connection)
    internal_metadata = ActiveRecord::InternalMetadata.new(connection.pool)

    if (database_id = internal_metadata[:database_id]).blank?
      internal_metadata[:database_id] = Nanoid.generate(size: 10)
    else
      database_id
    end
  end
end