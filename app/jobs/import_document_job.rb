class ImportDocumentJob < MemoryIntensiveJob
  include ImportFileMarkdown

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

    markdown, frontmatter = import_file_markdown(import_file)
    # YAML.safe_load happily returns a String or Array for `--- some bare text ---`;
    # #dig on those raises and would fail the whole file.
    frontmatter = nil unless frontmatter.is_a?(Hash)
    title = frontmatter&.dig("title") || title_fallback

    blocks = BlocknoteConverterService.markdown_to_blocks(markdown)
    sync = BlocknoteConverterService.blocks_to_yjs(blocks)

    ActiveRecord::Base.transaction do
      # Serialize concurrent threads: GoodJob can dispatch the same job to multiple
      # threads simultaneously (e.g., during rolling deployments). SELECT FOR UPDATE
      # ensures only one thread proceeds past this point per file — the others will
      # wait, then see :completed and roll back without creating a duplicate document.
      locked_file = ImportFile.lock.find(import_file.id)
      raise ActiveRecord::Rollback if locked_file.completed? || locked_file.failed? || locked_file.skipped?

      document = session.space.documents.create!(
        organization: session.organization,
        title: title
      )

      document.versions.create!(
        content_blocks: blocks,
        created_by: session.organization_membership.user
      )
      document.update!(sync: sync)

      if frontmatter&.dig("tags").is_a?(Array)
        valid_tags = frontmatter["tags"].select { |t| TagsService.valid_tag_name?(t.to_s) }

        TagsService.new(object: document, organization: session.organization)
          .update_tags(valid_tags)
      end

      locked_file.update!(
        status: :completed,
        document: document,
        processed_at: Time.current,
        error_message: nil
      )

      # Placed late in the transaction: the UPDATE holds a write lock on the spaces row
      # until commit, so everything slow should already be done by now.
      session.space.insert_hierarchy_node!(document.id, parent_id: parent_id)

      session.merge_path_map!(import_file.relative_path, document.id)
    end

  rescue StandardError => e
    import_file.update!(
      status: :failed,
      error_message: e.message,
      processed_at: Time.current
    )
  end

  private

  def parent_document_id(import_file, session)
    dir_path = import_file.directory_path
    return nil if dir_path == "."

    session.reload.path_map[dir_path]
  end
end
