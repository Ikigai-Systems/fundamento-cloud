class ImportSessionOrchestratorJob < ApplicationJob
  queue_as :imports

  def perform(session)
    return unless session.processing?

    # Build parent directory documents depth-first before processing files
    create_directory_documents(session)

    pending = session.import_files.where(status: :uploaded)

    # Never enqueue an empty batch. GoodJob fires on_finish synchronously for one (it has
    # no unfinished jobs to wait for), which re-runs link resolution and completion for a
    # session that is already done — the source of the duplicate versions. This happens on
    # every retry_failed with nothing to retry, and on any orchestrator re-run.
    if pending.none?
      # Only finish the session if nothing is still in flight: a re-run of an interrupted
      # orchestrator sees files as :processing, and ImportSessionCompletionJob would mark
      # those healthy files as failed.
      unless session.import_files.where(status: :processing).exists?
        ImportSessionCompletionJob.perform_later(session)
      end

      return
    end

    # Enqueue all file processing jobs in a Good Job batch
    GoodJob::Batch.enqueue(
      on_finish: ImportLinkResolutionJob,
      properties: { import_session_id: session.id }
    ) do
      pending.find_each do |import_file|
        if import_file.document?
          ImportDocumentJob.perform_later(import_file)
        else
          ImportAttachmentJob.perform_later(import_file)
        end
      end
    end
  end

  private

  def create_directory_documents(session)
    # Collect all unique directory paths, sorted by depth (shallowest first)
    dir_paths = session.import_files
      .pluck(:relative_path)
      .flat_map { |path| ancestor_paths(path) }
      .uniq
      .sort_by { |path| path.count("/") }

    dir_paths.each do |dir_path|
      next if dir_path == "."
      next if session.reload.path_map&.key?(dir_path)

      parent_path = File.dirname(dir_path)
      parent_id = parent_path == "." ? nil : session.path_map[parent_path]

      dir_name = File.basename(dir_path)
      space = session.space

      # Converted outside the transaction below: these shell out to Node, and the Space row
      # lock must not be held across a subprocess call.
      blocks = BlocknoteConverterService.markdown_to_blocks("")
      sync = BlocknoteConverterService.blocks_to_yjs(blocks)

      ActiveRecord::Base.transaction do
        document = space.documents.create!(
          organization: session.organization,
          title: dir_name,
          sync: sync
        )

        document.versions.create!(
          content_blocks: blocks,
          created_by: session.organization_membership.user
        )

        space.insert_hierarchy_node!(document.id, parent_id: parent_id)

        session.merge_path_map!(dir_path, document.id)
      end
    end
  end

  def ancestor_paths(file_path)
    parts = File.dirname(file_path).split("/")
    return [] if parts == ["."]

    parts.each_index.map { |i| parts[0..i].join("/") }
  end
end
