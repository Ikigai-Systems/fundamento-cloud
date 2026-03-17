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

  describe "#contributors" do
    fixtures :users, :organization_memberships, :document_editing_sessions

    it "returns unique users from editing sessions ordered by name" do
      document = documents(:one)
      contributors = document.contributors

      expect(contributors).to be_an(ActiveRecord::Relation)
      expect(contributors.map(&:display_name)).to eq(contributors.map(&:display_name).sort)
      expect(contributors.pluck(:id).uniq.length).to eq(contributors.length)
    end

    it "includes both editors and viewers" do
      document = documents(:one)
      contributors = document.contributors

      expect(contributors.map(&:id)).to include("user_pawel")
      expect(contributors.map(&:id)).to include("user_stefan")
    end

    it "returns empty relation when no editing sessions exist" do
      document = documents(:two)
      document.editing_sessions.delete_all

      expect(document.contributors).to be_empty
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

  describe "object_reference cleanup on destroy" do
    let(:organization) { organizations(:is) }
    let(:source_doc) { documents(:one) }
    let(:target_doc) { documents(:two) }

    it "nullifies target_id on object_references pointing to deleted document" do
      om = ObjectReference.create!(
        id: SecureRandom.uuid,
        source: source_doc,
        target_type: "Document",
        target_id: target_doc.id,
        title: "Target Doc",
        organization: organization
      )

      target_doc.space.remove_single_item_from_hierarchy!(target_doc.id)
      target_doc.destroy!

      om.reload
      expect(om.target_id).to be_nil
      expect(om.target_type).to eq("Document")
      expect(om.title).to eq("Target Doc")
    end

    it "deletes object_references where deleted document is the source" do
      om = ObjectReference.create!(
        id: SecureRandom.uuid,
        source: source_doc,
        target_type: "Document",
        target_id: target_doc.id,
        title: "Target Doc",
        organization: organization
      )

      source_doc.space.remove_single_item_from_hierarchy!(source_doc.id)
      source_doc.destroy!

      expect(ObjectReference.exists?(om.id)).to be false
    end
  end
end
