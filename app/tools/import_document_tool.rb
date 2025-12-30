class ImportDocumentTool < ApplicationTool
  description "Import a document from Word, or OpenOffice file. Accepts Base64-encoded file content."

  input_schema(
    properties: {
      space_npi: { type: :string },
      parent_document_npi: { type: :string },
      title: { type: :string },
      file_content: {
        type: :string,
        description: "Base64-encoded file content"
      },
      filename: {
        type: :string,
        description: "Original filename with extension (e.g., 'document.docx')"
      },
    },
    required: [:space_npi, :file_content, :filename]
  )

  annotations(
    title: "Import Document from File",
  )

  def self.call(space_npi:, file_content:, filename:, title: nil, parent_document_npi: nil, server_context:)
    pundit_user = pundit_user_from_context(server_context)

    # Decode Base64 file content
    decoded_content = Base64.decode64(file_content)

    # Create a temporary file for upload processing
    ext = File.extname(filename)
    temp_file = Tempfile.new([File.basename(filename, ext), ext])
    begin
      temp_file.binmode
      temp_file.write(decoded_content)
      temp_file.close

      # Create an ActionDispatch::Http::UploadedFile-like object
      uploaded_file = ActionDispatch::Http::UploadedFile.new(
        tempfile: temp_file,
        filename: filename,
        type: mime_type_from_filename(filename)
      )

      document = DocumentService.new(pundit_user: pundit_user).create_from_file!(
        space_npi: space_npi,
        file: uploaded_file,
        title: title,
        parent_document_npi: parent_document_npi
      )

      MCP::Tool::Response.new([
        {
          type: "text",
          text: DocumentBlueprint.render(document, view: :mcp)
        }
      ])
    ensure
      temp_file.unlink
    end
  end

  private

  def self.mime_type_from_filename(filename)
    ext = File.extname(filename).downcase

    mime_types = {
      ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".doc" => "application/msword",
      ".pdf" => "application/pdf",
      ".odt" => "application/vnd.oasis.opendocument.text"
    }

    mime_types[ext] || "application/octet-stream"
  end
end
