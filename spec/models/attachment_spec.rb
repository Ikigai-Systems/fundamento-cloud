require "rails_helper"

RSpec.describe Attachment, type: :model do
  fixtures :organizations, :spaces, :documents

  let(:organization) { organizations(:is) }
  let(:space) { spaces(:is_default) }
  let(:document) { documents(:one) }

  describe "associations" do
    it "belongs to organization" do
      attachment = Attachment.new(organization: organization, parent: document)
      expect(attachment.organization).to eq(organization)
    end

    it "belongs to parent" do
      attachment = Attachment.new(organization: organization, parent: document)
      expect(attachment.parent).to eq(document)
    end

    it "has one attached file" do
      attachment = Attachment.create!(
        organization: organization,
        parent: document,
        filename: "test.txt",
        mime_type: "text/plain"
      )
      attachment.file.attach(
        io: StringIO.new("test content"),
        filename: "test.txt",
        content_type: "text/plain"
      )

      expect(attachment.file).to be_attached
    end
  end

  describe "#stored_in_active_storage?" do
    context "when file is attached via Active Storage" do
      it "returns true" do
        attachment = Attachment.create!(
          organization: organization,
          parent: document,
          filename: "test.txt",
          mime_type: "text/plain"
        )
        attachment.file.attach(
          io: StringIO.new("test content"),
          filename: "test.txt",
          content_type: "text/plain"
        )

        expect(attachment.stored_in_active_storage?).to be true
      end
    end

    context "when only database storage is used" do
      it "returns false" do
        attachment = Attachment.create!(
          organization: organization,
          parent: document,
          filename: "test.txt",
          mime_type: "text/plain",
          data: "test content"
        )

        expect(attachment.stored_in_active_storage?).to be false
      end
    end

    context "when no storage is used" do
      it "returns false" do
        attachment = Attachment.create!(
          organization: organization,
          parent: document,
          filename: "test.txt",
          mime_type: "text/plain"
        )

        expect(attachment.stored_in_active_storage?).to be false
      end
    end
  end

  describe "#stored_in_database?" do
    it "returns true when data column has content" do
      attachment = Attachment.create!(
        organization: organization,
        parent: document,
        filename: "test.txt",
        mime_type: "text/plain",
        data: "test content"
      )

      expect(attachment.stored_in_database?).to be true
    end

    it "returns false when data column is nil" do
      attachment = Attachment.create!(
        organization: organization,
        parent: document,
        filename: "test.txt",
        mime_type: "text/plain"
      )

      expect(attachment.stored_in_database?).to be false
    end

    it "returns false when data column is empty" do
      attachment = Attachment.create!(
        organization: organization,
        parent: document,
        filename: "test.txt",
        mime_type: "text/plain",
        data: ""
      )

      expect(attachment.stored_in_database?).to be false
    end
  end

  describe "dual storage scenario" do
    it "can have both database and Active Storage" do
      attachment = Attachment.create!(
        organization: organization,
        parent: document,
        filename: "test.txt",
        mime_type: "text/plain",
        data: "test content"
      )
      attachment.file.attach(
        io: StringIO.new("test content"),
        filename: "test.txt",
        content_type: "text/plain"
      )

      expect(attachment.stored_in_database?).to be true
      expect(attachment.stored_in_active_storage?).to be true
    end
  end
end
