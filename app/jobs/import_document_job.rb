class ImportDocumentJob < ApplicationJob
  include MarkdownFrontmatter

  queue_as :imports

  def perform(import_file)
    return unless import_file.uploaded?

    import_file.update!(status: :processing)
    session = import_file.import_session

    markdown = fetch_markdown(import_file)
    markdown, frontmatter = extract_frontmatter(markdown)
    title = frontmatter&.dig("title") || File.basename(import_file.relative_path, ".*")

    parent_id = parent_document_id(import_file, session)

    blocks = BlocknoteConverterService.markdown_to_blocks(markdown)
    sync = BlocknoteConverterService.blocks_to_yjs(blocks)

    document = nil
    ActiveRecord::Base.transaction do
      document = session.space.documents.create!(
        organization: session.organization,
        title: title
      )

      hierarchy_node = session.space.create_hierarchy_node(document.id)
      if parent_id.present?
        session.space.add_item_to_hierarchy!(session.space.hierarchy, parent_id, hierarchy_node)
      else
        session.space.hierarchy.append(hierarchy_node)
      end
      session.space.save!

      document.versions.create!(
        content_blocks: blocks,
        created_by: session.organization_membership.user
      )
      document.update!(sync: sync)

      if frontmatter&.dig("tags").is_a?(Array)
        TagsService.new(object: document, organization: session.organization)
          .update_tags(frontmatter["tags"])
      end
    end

    import_file.update!(
      status: :completed,
      document: document,
      processed_at: Time.current,
      error_message: nil
    )

    session.merge_path_map!(import_file.relative_path, document.id)
    session.increment_counter!(:processed_files)

  rescue StandardError => e
    import_file.update!(
      status: :failed,
      error_message: e.message,
      processed_at: Time.current
    )
    session.increment_counter!(:failed_files)
  end

  private

  def fetch_markdown(import_file)
    import_file.file.open do |temp_file|
      case import_file.format
      when "markdown"
        temp_file.read
      when "docx", "odt", "doc"
        PandocConverterService.file_to_markdown(temp_file.path, import_file.format)
      else
        raise "Unsupported document format: #{import_file.format}"
      end
    end
  end

  def parent_document_id(import_file, session)
    dir_path = import_file.directory_path
    return nil if dir_path == "."

    session.reload.path_map[dir_path]
  end
end
