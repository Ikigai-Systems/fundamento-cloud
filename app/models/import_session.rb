class ImportSession < ApplicationRecord
  include NpiOrdering

  belongs_to :organization
  belongs_to :space
  belongs_to :organization_membership
  has_many :import_files, dependent: :destroy

  enum :status, {
    pending: 0,
    uploading: 1,
    processing: 2,
    completed: 3,
    failed: 4,
    partial: 5
  }

  enum :source_format, {
    generic: "generic",
    obsidian: "obsidian"
  }

  scope :recent, -> { order(created_at: :desc) }
  scope :expired, -> {
    where(status: [statuses[:pending], statuses[:uploading]])
      .where("expires_at < ?", Time.current)
  }

  # How long a finished import's uploaded source files are kept.
  #
  # They are a staging area, not a result: the documents and attachments an import produced are
  # first-class records of their own. What the sources are still good for is retrying a failed or
  # partial import (ImportSessionsController#retry_failed re-runs the orchestrator over them) and
  # working out why a conversion came out wrong -- both of which have a shelf life. Comparable
  # importers treat the upload as transient and do not offer it back.
  #
  # Thirty days to match the trash window, so "how long until it is really gone" has one answer
  # across the product.
  FINISHED_RETENTION = 30.days

  # Imports that ran to a conclusion, long enough ago that nobody is going to retry them.
  # `expired` covers the other case: uploads abandoned before processing ever started.
  scope :finished_and_stale, -> {
    where(status: statuses.values_at("completed", "partial", "failed"))
      .where("COALESCE(completed_processing_at, created_at) < ?", FINISHED_RETENTION.ago)
  }

  before_create :set_expires_at

  def all_files_uploaded?
    import_files.where.not(status: ImportFile.statuses.slice(:uploaded, :completed, :skipped).values).none?
  end

  def total_files    = import_files.count
  def uploaded_files = status_count(:uploaded)
  def processed_files = status_count(:completed)
  def failed_files   = status_count(:failed)
  def skipped_files  = status_count(:skipped)

  def preload_status_counts(counts_by_session_and_status)
    @preloaded_counts = counts_by_session_and_status
  end

  def merge_path_map!(relative_path, object_id)
    self.class.where(id: id).update_all(
      ["path_map = path_map || ?::jsonb", { relative_path => object_id }.to_json]
    )
  end

  # Documents are processed concurrently and each is appended to its parent as it finishes,
  # so siblings land in completion order — different on every run. Put them back in the
  # order of the source directory: folders first, then by name. Only the slots imported
  # documents already hold are reshuffled, so anything else in the space stays where it is.
  def sort_imported_documents!
    sort_keys = imported_document_sort_keys
    return if sort_keys.empty?

    space.with_locked_hierarchy do |locked_space|
      locked_space.hierarchy = self.class.sort_hierarchy_nodes(locked_space.hierarchy, sort_keys)
    end
  end

  def self.sort_hierarchy_nodes(nodes, sort_keys)
    nodes = Array(nodes).map { |node| node.merge("children" => sort_hierarchy_nodes(node["children"], sort_keys)) }

    slots = nodes.each_index.select { |i| sort_keys.key?(nodes[i]["id"].to_s) }
    sorted = slots.map { |i| nodes[i] }.sort_by { |node| sort_keys[node["id"].to_s] }
    slots.zip(sorted).each { |i, node| nodes[i] = node }

    nodes
  end

  private

  # { document_id => sort key } for every document the import created, folders included.
  # The path_map also holds attachments, which never appear in the hierarchy.
  def imported_document_sort_keys
    file_paths = import_files.pluck(:relative_path).to_set

    # Read from the row: merge_path_map! writes with update_all, so this instance is stale.
    current_path_map = self.class.where(id: id).pick(:path_map) || {}

    current_path_map.each_with_object({}) do |(path, object_id), keys|
      next if object_id.to_s.start_with?("attachment:")

      name = File.basename(path)
      keys[object_id.to_s] = [file_paths.include?(path) ? 1 : 0, name.downcase, name]
    end
  end

  def status_count(status_key)
    if @preloaded_counts
      @preloaded_counts.fetch([id, ImportFile.statuses[status_key]], 0)
    else
      import_files.where(status: status_key).count
    end
  end

  def set_expires_at
    self.expires_at ||= 7.days.from_now
  end
end
