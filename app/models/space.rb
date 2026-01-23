class Space < ApplicationRecord
  include NpiOrdering

  belongs_to :organization

  include ToReactProps
  # Keep it in sync with app/javascript/types.ts
  set_react_props :id, :name, :hierarchy

  include EmojiExtractable
  extracts_emoji_from :title

  has_many :automations, dependent: :destroy
  has_many :documents, dependent: :destroy
  has_many :document_imports, dependent: :destroy
  has_many :space_memberships, dependent: :destroy
  has_many :tables, dependent: :destroy
  has_many :tags, dependent: :delete_all

  belongs_to :home_document, class_name: "Document", optional: true

  validates_presence_of :name
  validates_presence_of :home_document, if: -> { home_document_id.present? }

  validates_uniqueness_of :name, scope: [:organization_id]

  after_create :create_home_document!

  enum :access_mode, [:public, :restricted, :private], suffix: true, validate: true

  def title
    name
  end

  def documents_from_hierarchy(starting_node = hierarchy)
    ids = traverse_hierarchy(starting_node)
    documents_in_db = self.documents.with_has_versions.where(id: ids)
    (ids - documents_in_db.map(&:id)).each do |missing_id|
      remove_single_item_from_hierarchy!(missing_id)
    end
    documents_in_db
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

    hierarchy_node = self.create_hierarchy_node(document.id)
    self.hierarchy.append(hierarchy_node)
    self.save!
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
