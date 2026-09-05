class Space < ApplicationRecord
  include NpiOrdering

  belongs_to :organization

  include ToReactProps
  # Keep it in sync with app/javascript/types.ts
  set_react_props :id, :name, :icon, :hierarchy

  include HasIcon
  has_icon derived_from: :name

  has_many :automations, dependent: :destroy
  has_many :documents, dependent: :destroy
  has_many :import_sessions, dependent: :destroy
  has_many :space_memberships, dependent: :destroy
  has_many :tables, dependent: :destroy
  has_many :tags, dependent: :delete_all

  belongs_to :home_document, class_name: "Document", optional: true

  validates_presence_of :name
  validates_presence_of :home_document, if: -> { home_document_id.present? }

  validates_uniqueness_of :name, scope: [:organization_id]

  after_create :create_home_document!

  enum :access_mode, [:public, :restricted, :private], suffix: true, validate: true

  scope :archived, -> { where(archived: true) }
  scope :without_archived, -> { where(archived: false) }

  def title
    name
  end

  # Returns only the documents in the hierarchy that still exist.
  #
  # This used to splice orphaned entries out of `hierarchy` in memory as a side effect,
  # without saving — so the work was redone on every render, and an unrelated later save
  # could persist it by accident. Callers that render the tree handle a missing document
  # themselves by promoting its children: see SpaceSidebarTree#build and
  # SpaceBlueprint.serialize_hierarchy_nodes.
  def documents_from_hierarchy(starting_node = hierarchy, scope: nil)
    (scope || self.documents.with_has_versions).where(id: traverse_hierarchy(starting_node))
  end

  def remove_single_item_from_hierarchy!(document_id, starting_node = hierarchy)
    starting_node.each_with_index do |item, index|
      if item["id"] == document_id
        starting_node.delete_at(index)

        item["children"].each do |child|
          starting_node.insert(index, child)
        end

        return true
      else
        if remove_single_item_from_hierarchy!(document_id, item["children"])
          return true
        end
      end
    end

    false
  end

  def remove_item_with_children_from_hierarchy!(document_id, starting_node = hierarchy)
    starting_node.each_with_index do |item, index|
      if item["id"] == document_id
        starting_node.delete_at(index)

        return item
      else
        if (removed_item = remove_item_with_children_from_hierarchy!(document_id, item["children"])).present?
          return removed_item
        end
      end
    end

    nil
  end

  def get_children_ids_from_hierarchy(document_id, starting_node = hierarchy)
    starting_node.each do |item|
      if item["id"] == document_id
        return item["children"].map { _1["id"] }
      else
        ids = get_children_ids_from_hierarchy(document_id, item["children"])
        return ids unless ids.nil?
      end
    end

    nil
  end

  def get_all_descendant_ids(document_id, starting_node = hierarchy)
    # Get all descendant IDs recursively (children, grandchildren, etc.)
    descendant_ids = []

    starting_node.each do |item|
      if item["id"] == document_id
        # Found the document, collect all its descendants
        collect_descendant_ids(item["children"], descendant_ids)
        return descendant_ids
      else
        # Recursively search in children
        ids = get_all_descendant_ids(document_id, item["children"])
        return ids if ids.present?
      end
    end

    []
  end

  def add_item_to_hierarchy!(starting_node, parent_id, item_to_add, position = nil, document_id = nil)
    if document_id == parent_id
      # FIXME: no idea why we have this here, doesn't make sense to me -- Pawel
      if position.nil?
        starting_node.append(item_to_add)
      else
        starting_node.insert(position, item_to_add)
      end

      return starting_node
    else
      starting_node.each do |item|
        if item["id"] == parent_id
          if position.nil?
            item["children"].append(item_to_add)
          else
            item["children"].insert(position, item_to_add)
          end

          return item
        else
          parent_item = add_item_to_hierarchy!(item["children"], parent_id, item_to_add, position, item["id"])
          return parent_item if parent_item.present?
        end
      end

      nil
    end
  end

  def create_hierarchy_node(document_id)
    { "id" => document_id, "children" => [] }
  end

  def self.hierarchy_lock_key(space_id)
    Zlib.crc32("space_#{space_id}_hierarchy")
  end

  # Serializes read-modify-write of the `hierarchy` JSON column. Every writer saves the
  # whole column, so without serialization concurrent writers each persist their own stale
  # copy and silently drop the other's nodes.
  #
  # Deliberately an advisory lock rather than SELECT ... FOR UPDATE. Callers normally
  # insert a document first, and that insert takes a FOR KEY SHARE lock on the parent
  # `spaces` row to enforce the foreign key. Asking for FOR UPDATE afterwards is a lock
  # upgrade, and two concurrent imports each holding KEY SHARE and each wanting UPDATE
  # deadlock — a full vault import produced a steady stream of PG::TRDeadlockDetected.
  # The advisory lock serializes the same critical section without touching row lock modes,
  # and the UPDATE below needs only FOR NO KEY UPDATE, which FOR KEY SHARE does not block.
  #
  # Yields the locked instance — mutate that, not the receiver. The receiver is reloaded
  # afterwards so callers that go on to render it don't see a stale hierarchy.
  def with_locked_hierarchy
    result = nil

    self.class.transaction do
      self.class.connection.execute("SELECT pg_advisory_xact_lock(#{self.class.hierarchy_lock_key(id)})")

      # Re-read inside the lock: under READ COMMITTED this picks up whatever the previous
      # holder committed, which is the whole point of serializing here.
      locked = self.class.find(id)
      result = yield locked
      locked.hierarchy_will_change!
      locked.save!
    end

    reload
    result
  end

  # Locks several spaces at once, always in id order so two concurrent moves in opposite
  # directions can't deadlock. Duplicates are collapsed, so a same-space move yields the
  # same instance twice.
  def self.with_locked_hierarchies(*spaces)
    ordered_ids = spaces.compact.map(&:id).uniq.sort
    result = nil

    transaction do
      ordered_ids.each do |space_id|
        connection.execute("SELECT pg_advisory_xact_lock(#{hierarchy_lock_key(space_id)})")
      end

      locked_by_id = ordered_ids.index_with { |space_id| find(space_id) }
      result = yield(*spaces.map { |space| space && locked_by_id[space.id] })
      locked_by_id.each_value do |locked|
        locked.hierarchy_will_change!
        locked.save!
      end
    end

    spaces.compact.uniq(&:id).each(&:reload)
    result
  end

  class ConcurrentHierarchyUpdate < StandardError; end

  HIERARCHY_INSERT_ATTEMPTS = 10

  # Inserts a node for `document_id` under `parent_id`, falling back to the root when the
  # parent isn't in the hierarchy — the recursive insert returns nil in that case, and
  # without the fallback the document would exist but never appear in the sidebar.
  #
  # Compare-and-swap rather than a lock. The write is a plain UPDATE guarded by the value we
  # read, so:
  #
  #   * no lost update — if anyone else committed in between, the guard matches nothing, we
  #     re-read and retry;
  #   * no deadlock — a plain UPDATE needs only FOR NO KEY UPDATE, which does not conflict
  #     with the FOR KEY SHARE that `documents.create!` takes on this row for the foreign
  #     key. Asking for FOR UPDATE here instead is a lock upgrade, and two concurrent imports
  #     each holding KEY SHARE and each wanting UPDATE deadlock;
  #   * no stall — nothing is held across the caller's other work, unlike an advisory lock
  #     scoped to the surrounding transaction.
  #
  # Under READ COMMITTED a concurrent writer makes this block on the row rather than return
  # 0 rows; Postgres then re-evaluates the guard against the newly committed tuple, so the
  # retry sees fresh data.
  def insert_hierarchy_node!(document_id, parent_id: nil)
    node = create_hierarchy_node(document_id)

    HIERARCHY_INSERT_ATTEMPTS.times do
      current = current_hierarchy
      updated = self.class.hierarchy_with_node(current, parent_id, node)

      changed = self.class
        .where(id: id)
        .where("hierarchy::jsonb = ?::jsonb", current.to_json)
        .update_all(["hierarchy = ?::json, updated_at = ?", updated.to_json, Time.current])

      if changed == 1
        reload
        return node
      end
    end

    raise ConcurrentHierarchyUpdate,
      "could not place #{document_id} in space #{id} after #{HIERARCHY_INSERT_ATTEMPTS} attempts"
  end

  # Reads straight from the row, bypassing this instance's possibly stale attribute.
  def current_hierarchy
    self.class.where(id: id).pick(:hierarchy) || []
  end

  # Pure: returns a new tree with `node` placed under `parent_id`, or appended at the root
  # when `parent_id` is blank or absent from the tree.
  def self.hierarchy_with_node(nodes, parent_id, node)
    nodes = Array(nodes)
    return nodes + [node] if parent_id.blank?

    placed = hierarchy_with_node_under_parent(nodes, parent_id, node)
    placed || nodes + [node]
  end

  # Returns a new tree, or nil when `parent_id` is not present anywhere in it.
  def self.hierarchy_with_node_under_parent(nodes, parent_id, node)
    found = false

    rebuilt = Array(nodes).map do |item|
      next item if found

      children = Array(item["children"])

      if item["id"] == parent_id
        found = true
        item.merge("children" => children + [node])
      elsif (updated_children = hierarchy_with_node_under_parent(children, parent_id, node))
        found = true
        item.merge("children" => updated_children)
      else
        item
      end
    end

    found ? rebuilt : nil
  end

  # Mapping of old hardcoded NPIs to descriptive CSV filenames
  # This allows BlockNote JSON files to continue using old NPIs as placeholders
  TABLE_ID_PLACEHOLDERS = {
    "7enpoTncq9" => "simple-grid-example",
    "7hDhcL1cyv" => "customer-sales-data",
    "u34fOBpaFp" => "advanced-features-example"
  }.freeze

  def populate_with_onboarding_content!
    Dir.glob("#{Rails.root.join("app", "templates", "space_onboarding_content")}/**/*.yjs") do |yjs_file|
      create_onboarding_document(yjs_file)
    end
  end

  private

  def collect_descendant_ids(nodes, accumulator)
    nodes.each do |node|
      accumulator << node["id"]
      collect_descendant_ids(node["children"], accumulator)
    end
  end

  def create_onboarding_document(yjs_file)
    directory = File.dirname(yjs_file)
    title_filename = directory + "/" + File.basename(yjs_file, ".*") + ".title.txt"

    document = self.organization.documents.create!(
      title: File.exist?(title_filename) ? File.read(title_filename) : File.basename(yjs_file, ".*"),
      sync: File.read(yjs_file),
      space: self,
    )

    # Load BlockNote JSON
    content_blocks = JSON.load_file!(directory + "/" + File.basename(yjs_file, ".*") + ".blocknote.json")

    # Create tables and build NPI mapping
    table_id_mapping = {}
    Dir.glob(directory + "/**/*.csv") do |csv_file|
      csv_filename = File.basename(csv_file, ".*")

      # Determine table name based on CSV filename
      table_name = if csv_filename == "customer-sales-data"
        "Advanced Table: Customer their first full month of sales"
      else
        "Table " + Nanoid.generate(size: 4)
      end

      table = self.tables.create!(
        name: table_name,
        parent: self.home_document || self.documents.first || nil,
        organization: self.organization,
      )

      table.import_from_csv(csv_file)

      # Store mapping from CSV filename to generated NPI
      table_id_mapping[csv_filename] = table.id
    end

    # Replace placeholder NPIs in BlockNote JSON with actual generated NPIs
    updated_content_blocks = replace_table_id_placeholders(content_blocks, table_id_mapping)

    document.versions.create!(
      content_blocks: updated_content_blocks
    )

    insert_hierarchy_node!(document.id)
  end

  def replace_table_id_placeholders(content_blocks, table_id_mapping)
    # Build reverse mapping from old hardcoded NPIs to actual generated NPIs
    id_replacements = {}

    TABLE_ID_PLACEHOLDERS.each do |old_id, csv_filename|
      if table_id_mapping[csv_filename]
        id_replacements[old_id] = table_id_mapping[csv_filename]
      end
    end

    # Deep traverse and replace NPIs in content blocks
    content_blocks.deep_dup.tap do |blocks|
      traverse_and_replace_ids(blocks, id_replacements)
    end
  end

  def traverse_and_replace_ids(obj, id_replacements)
    case obj
    when Hash
      obj.each do |key, value|
        # Replace tableNpi values
        if key == "tableNpi" && value.is_a?(String) && id_replacements[value]
          obj[key] = id_replacements[value]
        elsif value.is_a?(Hash) || value.is_a?(Array)
          traverse_and_replace_ids(value, id_replacements)
        end
      end
    when Array
      obj.each { |item| traverse_and_replace_ids(item, id_replacements) }
    end
  end

  def traverse_hierarchy(starting_node)
    ids = []
    starting_node.each do |item|
      if item.is_a? Numeric
        ids << item
      else
        ids << item["id"]
        ids += traverse_hierarchy(item["children"])
      end
    end
    ids
  end

  def create_home_document!
    return if home_document_id.present?

    home_document = documents.create!(
      title: "Home for #{name}",
      organization: organization,
      sync: File.read(Rails.root.join("app", "templates", "space.yjs"))
    )

    home_document.versions.create!(
      content_blocks: JSON.load_file!(Rails.root.join("app", "templates", "space.blocknote.json"))
    )

    update!(home_document: home_document)
  end
end
