require "rails_helper"

RSpec.describe Document, type: :model do
  fixtures :organizations, :spaces, :documents

  describe "NPI primary key migration" do
    it "uses string ID as primary key" do
      document = documents(:one)
      expect(document.id).to be_a(String)
    end

    it "has string document_id in versions" do
      document = Document.create!(
        id: "testdoc01",
        organization: organizations(:is),
        space_id: "is_default"
      )

      version = document.versions.create!

      expect(version.document_id).to be_a(String)
      expect(version.document_id).to eq(document.id)
      expect(version.document_id).to eq("testdoc01")
    end

    it "has string home_document_id in spaces" do
      document = Document.create!(
        id: "testdoc02",
        organization: organizations(:is),
        space_id: "is_default"
      )

      space = spaces(:is_default)
      space.update!(home_document: document)

      space.reload
      expect(space.home_document_id).to be_a(String)
      expect(space.home_document_id).to eq(document.id)
      expect(space.home_document_id).to eq("testdoc02")
    end
  end

  describe "validations" do
    it "requires an organization" do
      document = Document.new(space_id: "is_default")
      expect(document.valid?).to be false
      expect(document.errors[:organization]).to include("must exist")
    end

    it "requires a space" do
      document = Document.new(organization: organizations(:is))
      expect(document.valid?).to be false
      expect(document.errors[:space]).to include("must exist")
    end
  end
end
