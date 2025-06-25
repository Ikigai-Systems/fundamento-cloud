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
      latest_version = document.versions.order(updated_at: :desc).first
      if latest_version&.content_blocks.present?
        begin
          # Parse content as it might be stored as string or JSON
          content_data = latest_version.content_blocks.is_a?(String) ? JSON.parse(latest_version.content_blocks) : latest_version.content_blocks
          # Convert content to markdown using blocknote-converter CLI
          markdown_content = convert_blocks_to_markdown(content_data)
          content += markdown_content if markdown_content.present?
        rescue => e
          puts "Warning: Failed to convert blocks to markdown for #{org_name}/#{space_name}/#{doc_title}: #{e.message}"
          content += "_Content conversion failed_\n"
        end
      else
        content += "_No content available_\n"
      end

      # Create markdown file
      file_path = File.join(dir_path, "#{doc_title}.md")
      File.write(file_path, content)

      puts "Exported: #{org_name}/#{space_name}/#{doc_title}.md"
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
end