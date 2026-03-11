require "rails_helper"

RSpec.describe ImportFile, type: :model do
  fixtures :organizations, :users, :spaces, :organization_memberships, :import_sessions

  let(:session) { import_sessions(:is_session_uploading) }

  describe "validations" do
    it "requires import_session and relative_path" do
      file = ImportFile.new
      expect(file.valid?).to be false
      expect(file.errors[:import_session]).to include("must exist")
      expect(file.errors[:relative_path]).to include("can't be blank")
    end
  end

  describe "enums" do
    it "has correct file_type values" do
      expect(ImportFile.file_types.keys).to contain_exactly("document", "attachment")
    end

    it "has correct status values" do
      expect(ImportFile.statuses.keys).to contain_exactly(
        "pending", "uploading", "uploaded", "processing", "completed", "failed", "skipped"
      )
    end
  end

  describe "scopes" do
    it ".for_session returns files for the given session" do
      file = ImportFile.create!(
        import_session: session,
        relative_path: "Notes/test.md",
        file_type: :document,
        format: "markdown"
      )
      expect(ImportFile.where(import_session: session)).to include(file)
    end
  end
end
