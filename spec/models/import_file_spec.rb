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

  describe ".classify" do
    it "recognises the formats we can convert into documents" do
      expect(ImportFile.classify("Notes/hello.md")).to eq([:document, "markdown"])
      expect(ImportFile.classify("Notes/hello.markdown")).to eq([:document, "markdown"])
      expect(ImportFile.classify("Notes/report.docx")).to eq([:document, "docx"])
      expect(ImportFile.classify("Notes/report.odt")).to eq([:document, "odt"])
    end

    it "recognises known attachment formats" do
      expect(ImportFile.classify("Pliki/photo.png")).to eq([:attachment, "image"])
      expect(ImportFile.classify("Pliki/scan.pdf")).to eq([:attachment, "pdf"])
      expect(ImportFile.classify("Pliki/clip.mp4")).to eq([:attachment, "video"])
    end

    it "stores .doc as a file rather than a document Pandoc cannot read" do
      # Pandoc reads DOCX but not DOC. Sending it as a document guarantees a failure, which
      # is what the CLI still does.
      expect(ImportFile.classify("Osobiste/Outline.doc")).to eq([:attachment, "other"])
    end

    it "defaults anything unrecognised to an attachment" do
      # The old clients defaulted the other way, so .txt/.csv/.zip became documents that
      # could only fail.
      ["notes.txt", "data.csv", "archive.zip", "deck.pptx", "audio.m4a", "sheet.xlsx"].each do |name|
        expect(ImportFile.classify(name)).to eq([:attachment, "other"]), "expected #{name} to be an attachment"
      end
    end

    it "ignores extension case and handles files without one" do
      expect(ImportFile.classify("Notes/HELLO.MD")).to eq([:document, "markdown"])
      expect(ImportFile.classify("Pliki/PHOTO.JPG")).to eq([:attachment, "image"])
      expect(ImportFile.classify("Pliki/LICENSE")).to eq([:attachment, "other"])
    end

    it "only ever produces formats the pipeline supports" do
      formats = ImportFile::DOCUMENT_FORMATS_BY_EXTENSION.values.uniq
      expect(formats - ImportFile::SUPPORTED_DOCUMENT_FORMATS).to be_empty

      formats = ImportFile::ATTACHMENT_FORMATS_BY_EXTENSION.values.uniq + ["other"]
      expect(formats - ImportFile::SUPPORTED_ATTACHMENT_FORMATS).to be_empty
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
