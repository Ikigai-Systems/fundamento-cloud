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
end
