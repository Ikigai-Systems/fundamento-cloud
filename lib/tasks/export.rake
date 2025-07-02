namespace :fundamento do
  desc "Export all documents to temporary folder with structure /[Organization]/[Space]/[Document].md"
  task export: :environment do
    export_path = Rails.root.join("tmp", "document_export_#{Time.current.strftime('%Y-%m-%d_%H:%M:%S')}")
    FileUtils.mkdir_p(export_path)

    puts "Exporting documents to: #{export_path}"

    # Create attachments subdirectory
    attachments_dir = File.join(export_path, "attachments")
    FileUtils.mkdir_p(attachments_dir)

    Document.includes(organization: [], space: [], versions: [], comments: [organization_user: :user]).find_each do |document|
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
          markdown_content = process_attachment_links(markdown_content, attachments_dir, document.organization) if markdown_content.present?

          # Process table references in the markdown content
          markdown_content = process_table_references(markdown_content, document.organization) if markdown_content.present?

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

      # Process and append comments chronologically
      comments = document.comments.order(:created_at)
      if comments.any?
        content += "\n\n---\n\n# Comments\n\n"
        
        comments.each do |comment|
          begin
            content += "---\n\n"
            content += "**Comment by #{comment.organization_user.display_name}** (#{comment.created_at.strftime('%B %d, %Y at %I:%M %p')})\n\n"
            
            # Process comment content (same as document content)
            comment_content = comment.content
            if comment_content.present?
              # Convert comment content to markdown
              comment_markdown = convert_blocks_to_markdown(comment_content)

              # Process attachment links in comment content
              comment_markdown = process_attachment_links(comment_markdown, attachments_dir, document.organization) if comment_markdown.present?

              # Process table references in comment content
              comment_markdown = process_table_references(comment_markdown, document.organization) if comment_markdown.present?

              content += comment_markdown if comment_markdown.present?
            else
              content += "_Empty comment_\n"
            end
            content += "\n\n"
          rescue => e
            content += "_Comment processing failed_\n\n"
            Rails.logger.error("Failed to process comment #{comment.id}: #{e.message}")
          end
        end
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

  def process_attachment_links(markdown_content, attachments_dir, organization)
    # Replace attachment: links with file references
    markdown_content.gsub(/attachment:(\d+)/) do |match|
      attachment_id = $1.to_i
      
      begin
        attachment = organization.attachments.find(attachment_id)
        
        # Create a safe filename prefixed with attachment ID for uniqueness
        base_filename = sanitize_filename(attachment.filename || "attachment")
        safe_filename = "#{attachment_id}-#{base_filename}"
        
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
        org_name = sanitize_filename(organization.name)

        attachment_path = File.join(attachments_dir, org_name, safe_filename)
        File.binwrite(attachment_path, attachment.data)
        
        # Return relative path for markdown
        "#{ENV["ATTACHMENTS_URL"]}/attachments/#{org_name}/#{safe_filename}"
      rescue ActiveRecord::RecordNotFound
        # If attachment doesn't exist, leave the original link unchanged
        match
      rescue => e
        Rails.logger.error("Failed to process attachment #{attachment_id}: #{e.message}")
        match
      end
    end
  end

  def process_table_references(markdown_content, organization)
    # Replace [Table reference: (id|npi)] patterns with markdown tables
    markdown_content.gsub(/`\[Table reference: ([^\]]+)\]`/) do |match|
      table_identifier = $1.strip
      
      begin
        # Try to find table by NPI first, then by ID
        table = organization.tables.find_by_param!(table_identifier)
        
        # Get table data
        table_data = table.data_to_json(evaluate_formulas: false)
        
        # Convert to markdown table
        convert_table_data_to_markdown(table_data, table.name)
      rescue ActiveRecord::RecordNotFound
        # If table doesn't exist, leave the original reference unchanged
        match
      rescue => e
        Rails.logger.error("Failed to process table reference #{table_identifier}: #{e.message}")
        match
      end
    end
  end

  def convert_table_data_to_markdown(table_data, table_name = nil)
    columns = table_data[:columns]
    rows = table_data[:rows]
    
    return "_Empty table_" if columns.empty? || rows.empty?
    
    # Start with table name if provided
    markdown = ""
    markdown += "Table **#{table_name}**:\n\n" if table_name.present?
    
    # Create header row
    headers = columns.map { |col| col.name || col.npi }
    markdown += "| " + headers.join(" | ") + " |\n"
    
    # Create separator row
    markdown += "| " + (["---"] * columns.length).join(" | ") + " |\n"
    
    # Create data rows
    rows.each do |row|
      row_values = columns.map do |col|
        value = row[col.npi]
        
        # Format different column types appropriately
        case col.kind
        when "checkbox"
          value ? "✓" : ""
        when "date"
          value.present? ? value : ""
        else
          # Escape pipe characters in cell content to prevent table breaking
          value.to_s.gsub("|", "\\|")
        end
      end
      
      markdown += "| " + row_values.join(" | ") + " |\n"
    end
    
    markdown += "\n"
    markdown
  end
end