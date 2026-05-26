class ImportDocumentJob < MemoryIntensiveJob
  include MarkdownFrontmatter

  queue_as :imports

  def perform(import_file)
    # Allow retry from :processing — jobs interrupted mid-run (SIGTERM, OOM) leave
    # the file in :processing. Returning early here causes the Good Job batch to
    # fire on_finish without the file ever being processed.
    return if import_file.completed? || import_file.failed? || import_file.skipped?

    import_file.update!(status: :processing)
    session = import_file.import_session
    parent_id = parent_document_id(import_file, session)
    title_fallback = File.basename(import_file.relative_path, ".*")

    # Release the DB connection before slow network I/O (S3 download + two HTTP calls
    # to BlocknoteConverter). Rails re-acquires automatically when the transaction below
    # needs it. Without this, concurrent jobs hold idle connections during network waits
    # and starve the Good Job Notifier (ConnectionTimeoutError).
    ActiveRecord::Base.connection_pool.release_connection

    markdown = fetch_markdown(import_file)
    markdown, frontmatter = extract_frontmatter(markdown)
    title = frontmatter&.dig("title") || title_fallback

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

      # Mark completed inside the transaction so an InterruptError after commit
      # leaves the file in :completed state, preventing duplicate document creation
      # on retry (the guard at the top of perform returns early for :completed files).
      import_file.update!(
        status: :completed,
        document: document,
        processed_at: Time.current,
        error_message: nil
      )

      session.merge_path_map!(import_file.relative_path, document.id)
      session.increment_counter!(:processed_files)
    end

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
