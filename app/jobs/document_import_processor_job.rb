class DocumentImportProcessorJob < ApplicationJob
  queue_as :default

  def perform(document_import)
    return unless document_import.file.attached?

    # Extract text content from the file
    content = extract_text_content(document_import)

    document = create_document_from_content(document_import, content)

    # Update the imported_content field
    document_import.update!(
      imported_content: content,
      imported_at: Time.current,
      document: document,
    )
  end

  private

  def create_document_from_content(document_import, content)
    space = document_import.space

    space.documents.create!(
      organization: space.organization,
      title: document_import.file.filename,
    ).tap do |document|
      document.versions.create!(
        content_blocks: [],
        content_html: content,
      )
    end
  end

  def extract_text_content(document_import)
    file = document_import.file
    content_type = file.content_type

    case content_type
    when "text/markdown", "text/plain"
      # For text files, read directly
      file.download
    when "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      # For .docx files
      extract_docx_content(file)
    when "application/msword"
      # For .doc files (legacy format)
      extract_doc_content(file)
    else
      raise "Unsupported file type: #{content_type}"
    end
  end

  def extract_docx_content(file)
    # Use the blocknote converter service to extract content
    file.open do |temp_file|
      # You can use your existing blocknote converter or a gem like 'docx' or 'yomu'
      # For now, let's use a simple approach with the 'docx' gem
      require 'docx'

      doc = Docx::Document.open(temp_file.path)
      doc.paragraphs.map(&:text).join("\n")
    end
  end

  def extract_doc_content(file)
    # For .doc files, you might need a different approach
    # This could use libreoffice headless conversion or other tools
    file.open do |temp_file|
      # This is a placeholder - you'd need to implement actual .doc parsing
      # or use system commands like: `antiword #{temp_file.path}`
      "[Doc file content extraction not yet implemented]"
    end
  end
end