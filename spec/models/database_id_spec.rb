require "rails_helper"

RSpec.describe DatabaseId, type: :model do
  let(:connection) { ActiveRecord::Base.connection }

  describe ".get" do
    it "retrieves database_id from internal metadata" do
      result = DatabaseId.get(connection)

      expect(result).to be_present
      expect(result).to be_a(String)
    end
  end

  describe ".rotate!" do
    # The id namespaces the editor's IndexedDB key, so changing it is how every browser is made
    # to reload a document from the server instead of merging the copy it already has. Anything
    # that rewrites stored content depends on this working.
    it "replaces the id with a new nanoid" do
      before = DatabaseId.get(connection)

      DatabaseId.rotate!(connection)

      expect(DatabaseId.get(connection)).not_to eq(before)
      expect(DatabaseId.get(connection)).to match(/\A[A-Za-z0-9_-]{10}\z/)
    end

    it "gives a different id each time" do
      ids = 3.times.map { DatabaseId.rotate!(connection); DatabaseId.get(connection) }

      expect(ids.uniq.size).to eq(3)
    end
  end
end
