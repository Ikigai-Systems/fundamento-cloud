require "rails_helper"

RSpec.describe PandocConverterService do
  describe ".convert_upload" do
    let(:docx_file) do
      Rack::Test::UploadedFile.new(
        file_fixture("pandoc/Volume-2-Terms-of-Reference.docx"),
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
    end

    let(:pdf_file) do
      Rack::Test::UploadedFile.new(
        file_fixture("pandoc/Volume-2-Terms-of-Reference.pdf"),
        "application/pdf"
      )
    end

    let(:odt_file) do
      Rack::Test::UploadedFile.new(
        file_fixture("pandoc/Volume-2-Terms-of-Reference.odt"),
        "application/vnd.oasis.opendocument.text"
      )
    end

    it "converts DOCX file to markdown" do
      result = described_class.convert_upload(docx_file)

      expect(result[:markdown]).to be_present
      expect(result[:title]).to eq("Volume-2-Terms-of-Reference")
      expect(result[:metadata]).to be_a(Hash)
    end

    it "rejects PDF as it is not supported" do
      expect {
        described_class.convert_upload(pdf_file)
      }.to raise_error(PandocConverterService::ConversionError, /Unsupported file type/)
    end

    it "converts ODT file to markdown" do
      result = described_class.convert_upload(odt_file)

      expect(result[:markdown]).to be_present
      expect(result[:title]).to eq("Volume-2-Terms-of-Reference")
      expect(result[:metadata]).to be_a(Hash)
    end

    it "rejects unsupported file types" do
      exe_file = Rack::Test::UploadedFile.new(
        file_fixture("pandoc/malware.exe"),
        "application/octet-stream"
      )

      expect {
        described_class.convert_upload(exe_file)
      }.to raise_error(PandocConverterService::ConversionError, /Unsupported file type/)
    end

    it "rejects files exceeding size limit" do
      allow(docx_file).to receive(:size).and_return(51.megabytes)

      expect {
        described_class.convert_upload(docx_file)
      }.to raise_error(PandocConverterService::ConversionError, /exceeds 50MB limit/)
    end

    it "extracts title from filename" do
      result = described_class.convert_upload(docx_file)

      expect(result[:title]).to eq("Volume-2-Terms-of-Reference")
    end
  end
end
