namespace :fundamento do
  desc "Export all documents to temporary folder with structure /[Organization]/[Space]/[Document].md"
  task export: :environment do
    export_path = Rails.root.join("tmp", "document_export_#{Time.current.strftime('%Y-%m-%d_%H:%M:%S')}")
    FileUtils.mkdir_p(export_path)

    puts "Exporting documents to: #{export_path}"

    Document.includes(organization: [], space: [], versions: []).find_each do |document|
      # Sanitize names for filesystem
      org_name = sanitize_filename(document.organization.name)
      space_name = sanitize_filename(document.space.name)
      doc_title = sanitize_filename(document.title)

      # Create directory structure
      dir_path = File.join(export_path, org_name, space_name)
      FileUtils.mkdir_p(dir_path)

      # Start with document title
      content = "# #{document.title}\n\n"

      # Get latest version if available
      success = true
      latest_version = document.versions.order(updated_at: :desc).first

      if latest_version&.content_blocks.present?
        begin
          # Parse content as it might be stored as string or JSON
          content_data = latest_version.content_blocks.is_a?(String) ? JSON.parse(latest_version.content_blocks) : latest_version.content_blocks
          # Convert content to markdown using blocknote-converter CLI
          markdown_content = convert_blocks_to_markdown(content_data)

          # Process attachment links in the markdown content
          markdown_content = process_attachment_links(markdown_content, dir_path, document.organization) if markdown_content.present?
          content += markdown_content if markdown_content.present?
        rescue => e
          success = false
          content += "_Content conversion failed_\n\n"
          content += latest_version.content_blocks.to_json + "\n\n"
          content += e.message
          content += "\n\n"
          content += e.backtrace.join("\n")
        end
      else
        content += "_No content available_\n"
      end

      # Create markdown file
      file_path = File.join(dir_path, "#{doc_title}.md")
      File.write(file_path, content)

      puts "#{org_name}/#{space_name}/#{doc_title}.md : #{success ? "OK" : "FAILED"}"
    end

    puts "Export completed. #{Document.count} documents exported to #{export_path}"
  end

  private

  def sanitize_filename(name)
    # Remove or replace characters that are invalid in filenames
    name.gsub(/[\/\\:*?"<>|]/, "_").strip
  end

  def convert_blocks_to_markdown(content_data)
    require 'tempfile'
    require 'open3'

    # Create temporary file with content JSON
    temp_file = Tempfile.new(['blocks', '.json'])
    temp_file.write(content_data.to_json)
    temp_file.close

    # Run blocknote-converter CLI
    converter_path = Rails.root.join("micro-services", "blocknote-converter", "build", "blocknoteConverter.js")
    stdout, stderr, status = Open3.capture3("node", converter_path.to_s, "convert-blocks-to-markdown", "-i", temp_file.path)

    temp_file.unlink

    if status.success?
      # The output is JSON-wrapped, so we need to parse it
      result = JSON.parse(stdout)
      return result.is_a?(String) ? result : result.to_s
    else
      Rails.logger.error("BlockNote converter error: #{stderr}")
      raise StandardError.new("BlockNote conversion failed: #{stderr}")
    end
  end

  def process_attachment_links(markdown_content, export_dir, organization)
    # Create attachments subdirectory
    attachments_dir = File.join(export_dir, "attachments")
    FileUtils.mkdir_p(attachments_dir)

    # Replace attachment: links with file references
    markdown_content.gsub(/attachment:(\d+)/) do |match|
      attachment_id = $1.to_i
      
      begin
        attachment = organization.attachments.find(attachment_id)
        
        # Create a safe filename
        safe_filename = sanitize_filename(attachment.filename || "attachment_#{attachment_id}")
        
        # Ensure we have a file extension if one exists in the original filename
        if attachment.filename && !safe_filename.include?(".")
          # Try to add extension based on mime_type if filename doesn't have one
          case attachment.mime_type
          when /^image\/jpeg/
            safe_filename += ".jpg"
          when /^image\/png/
            safe_filename += ".png"
          when /^image\/gif/
            safe_filename += ".gif"
          when /^text\/plain/
            safe_filename += ".txt"
          when /^application\/pdf/
            safe_filename += ".pdf"
          end
        end
        
        # Write attachment data to file
        attachment_path = File.join(attachments_dir, safe_filename)
        File.binwrite(attachment_path, attachment.data)
        
        # Return relative path for markdown
        "attachments/#{safe_filename}"
      rescue ActiveRecord::RecordNotFound
        # If attachment doesn't exist, leave the original link unchanged
        match
      rescue => e
        Rails.logger.error("Failed to process attachment #{attachment_id}: #{e.message}")
        match
      end
    end
  end
end