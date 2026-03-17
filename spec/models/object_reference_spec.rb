require "rails_helper"

RSpec.describe ObjectReference, type: :model do
  fixtures :organizations, :users, :spaces, :documents, :object_references

  describe "validations" do
    it "is valid with all required fields" do
      mention = ObjectReference.new(
        id: SecureRandom.uuid,
        source_type: "Document",
        source_id: documents(:one).id,
        target_type: "Document",
        target_id: documents(:two).id,
        title: "Two",
        organization: organizations(:is)
      )
      expect(mention).to be_valid
    end

    it "is valid without target_id (broken link)" do
      mention = ObjectReference.new(
        id: SecureRandom.uuid,
        source_type: "Document",
        source_id: documents(:one).id,
        target_type: "Document",
        target_id: nil,
        title: "Missing Doc",
        organization: organizations(:is)
      )
      expect(mention).to be_valid
    end

    it "requires source_type" do
      mention = object_references(:doc_mention_to_doc).dup
      mention.id = SecureRandom.uuid
      mention.source_type = nil
      expect(mention).not_to be_valid
    end

    it "requires source_id" do
      mention = object_references(:doc_mention_to_doc).dup
      mention.id = SecureRandom.uuid
      mention.source_id = nil
      expect(mention).not_to be_valid
    end

    it "requires target_type" do
      mention = object_references(:doc_mention_to_doc).dup
      mention.id = SecureRandom.uuid
      mention.target_type = nil
      expect(mention).not_to be_valid
    end

    it "requires title" do
      mention = object_references(:doc_mention_to_doc).dup
      mention.id = SecureRandom.uuid
      mention.title = nil
      expect(mention).not_to be_valid
    end

    it "requires organization" do
      mention = object_references(:doc_mention_to_doc).dup
      mention.id = SecureRandom.uuid
      mention.organization_id = nil
      expect(mention).not_to be_valid
    end
  end

  describe "#broken?" do
    it "returns true when target_id is nil" do
      expect(object_references(:broken_doc_mention)).to be_broken
    end

    it "returns false when target_id is present" do
      expect(object_references(:doc_mention_to_doc)).not_to be_broken
    end
  end

  describe "scopes" do
    it ".current returns only current mentions" do
      results = ObjectReference.current
      expect(results).to include(object_references(:doc_mention_to_doc))
      expect(results).not_to include(object_references(:old_version_mention))
    end

    it ".broken returns only broken mentions" do
      results = ObjectReference.broken
      expect(results).to include(object_references(:broken_doc_mention))
      expect(results).not_to include(object_references(:doc_mention_to_doc))
    end

    it ".for_source returns mentions for a specific source" do
      doc_one = documents(:one)
      results = ObjectReference.for_source(doc_one)
      expect(results).to include(object_references(:doc_mention_to_doc))
      expect(results).to include(object_references(:doc_mention_to_user))
      expect(results).not_to include(object_references(:broken_doc_mention))
    end

    it ".pointing_to returns mentions targeting a specific object" do
      doc_two = documents(:two)
      results = ObjectReference.pointing_to("Document", doc_two.id)
      expect(results).to include(object_references(:doc_mention_to_doc))
      expect(results).not_to include(object_references(:doc_mention_to_user))
    end
  end

  describe "ID generation" do
    it "uses the explicitly set UUID, not auto-generated NPI" do
      uuid = SecureRandom.uuid
      mention = ObjectReference.create!(
        id: uuid,
        source_type: "Document",
        source_id: documents(:one).id,
        target_type: "Document",
        target_id: documents(:two).id,
        title: "Test",
        organization: organizations(:is)
      )
      expect(mention.id).to eq(uuid)
      expect(mention.id.length).to eq(36) # UUID length, not NPI's 10
    end
  end
end
