class ImportSessionOrchestratorJob < ApplicationJob
  queue_as :imports

  def perform(session)
    return unless session.processing?

    # Build parent directory documents depth-first before processing files
    create_directory_documents(session)

    # Enqueue all file processing jobs in a Good Job batch
    GoodJob::Batch.enqueue(
      on_finish: ImportLinkResolutionJob,
      properties: { import_session_id: session.id }
    ) do
      session.import_files.where(status: :uploaded).find_each do |import_file|
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

      blocks = BlocknoteConverterService.markdown_to_blocks("")
      sync = BlocknoteConverterService.blocks_to_yjs(blocks)

      document = space.documents.create!(
        organization: session.organization,
        title: dir_name,
        sync: sync
      )

      document.versions.create!(
        content_blocks: blocks,
        created_by: session.organization_membership.user
      )

      hierarchy_node = space.create_hierarchy_node(document.id)
      if parent_id.present?
        space.add_item_to_hierarchy!(space.hierarchy, parent_id, hierarchy_node)
      else
        space.hierarchy.append(hierarchy_node)
      end
      space.save!

      session.merge_path_map!(dir_path, document.id)
    end
  end

  def ancestor_paths(file_path)
    parts = File.dirname(file_path).split("/")
    return [] if parts == ["."]

    parts.each_index.map { |i| parts[0..i].join("/") }
  end
end
