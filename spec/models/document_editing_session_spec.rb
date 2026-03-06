require "rails_helper"

RSpec.describe DocumentEditingSession, type: :model do
  fixtures :organizations, :users, :organization_memberships,
           :spaces, :documents, :document_editing_sessions

  describe "associations" do
    let(:session) { document_editing_sessions(:session_pawel_doc_one) }

    it "belongs to a document" do
      expect(session.document).to eq(documents(:one))
    end

    it "belongs to a member (organization membership)" do
      expect(session.member).to eq(organization_memberships(:om_is_pawel))
    end

    it "optionally belongs to a version" do
      expect(session.version).to be_nil
    end
  end

  describe "NPI primary key" do
    let(:session) { document_editing_sessions(:session_pawel_doc_one) }

    it "has a string id" do
      expect(session.id).to be_a(String)
    end
  end

  describe ".editors" do
    it "returns only sessions where edited is true" do
      editors = DocumentEditingSession.where(document: documents(:one)).editors
      expect(editors).to include(document_editing_sessions(:session_pawel_doc_one))
      expect(editors).not_to include(document_editing_sessions(:session_stefan_doc_one))
    end
  end

  describe ".unlinked" do
    it "returns only sessions with no version" do
      unlinked = DocumentEditingSession.unlinked
      expect(unlinked).to include(document_editing_sessions(:session_pawel_doc_two))
    end
  end
end
