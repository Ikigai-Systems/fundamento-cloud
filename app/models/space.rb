class Space < ApplicationRecord
  belongs_to :organization

  include ModelWithNpiAsParam
  include ToReactProps

  # Keep it in sync with app/javascript/types.ts
  set_react_props :npi, :name, :hierarchy

  has_many :automations, dependent: :destroy
  has_many :documents, dependent: :destroy
  has_many :document_imports, dependent: :destroy
  has_many :space_memberships, dependent: :destroy
  has_many :tables, dependent: :destroy

  belongs_to :home_document, class_name: "Document", optional: true

  validates_presence_of :name
  validates_presence_of :home_document, if: -> { home_document_id.present? }

  validates_uniqueness_of :name, scope: [:organization_id]

  after_create :create_home_document!

  enum :access_mode, [:public, :restricted, :private], suffix: true, validate: true

  def documents_from_hierarchy(starting_node = hierarchy)
    ids = traverse_hierarchy(starting_node)
    documents_in_db = self.documents.with_has_versions.where(id: ids)
    (ids - documents_in_db.map(&:id)).each do |missing_id|
      remove_single_item_from_hierarchy!(missing_id)
    end
    documents_in_db
  end

  def remove_single_item_from_hierarchy!(document_id, starting_node = hierarchy)
    document_id = document_id.to_i

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
    document_id = document_id.to_i

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
    document_id = document_id.to_i

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

  def populate_with_onboarding_content!
    def create_document(yjs_file)
      directory = File.dirname(yjs_file)
      title_filename = directory + "/" + File.basename(yjs_file, ".*") + ".title.txt"

      document = self.organization.documents.create!(
        title: File.exist?(title_filename) ? File.read(title_filename) : File.basename(yjs_file, ".*"),
        sync: File.read(yjs_file),
        space: self,
      )

      document.versions.create!(
        content_blocks: JSON.load_file!(directory + "/" + File.basename(yjs_file, ".*") + ".blocknote.json")
      )

      hierarchy_node = self.create_hierarchy_node(document.id)
      self.hierarchy.append(hierarchy_node)
      self.save!

      Dir.glob(directory + "/**/*.csv") do |csv_file|
        npi = File.basename(csv_file, ".*")
        table = self.tables.create!(
          npi: npi,
          name: "Table " + Nanoid.generate(size: 4),
          parent: self.home_document || self.documents.first || nil,
          organization: self.organization,
        )
        table.import_from_csv(csv_file)
        if npi == "7hDhcL1cyv"
          table.update(name: "Advanced Table: Customer their first full month of sales")
          table.columns_in_order[0].update(npi: "sample_column_name")
          table.columns_in_order[1].update(npi: "sample_column_2", kind: Tables::Column::to_kind("date"))
          table.columns_in_order[2].update(npi: "sample_column_3", kind: Tables::Column::to_kind("number"))
          table.columns_in_order[3].update(npi: "eXqGtIyEmPqW2pC0uwk39")
          table.columns_in_order[4].update(npi: "I2aoi-2OSTI-BV6UbzDls")
          table.columns_in_order[5].update(npi: "hqqVKn_9zECje3en054vE")
          table.columns_in_order[6].update(npi: "sample_column_4")
        end
      end
    end

    Dir.glob("#{Rails.root.join("app", "templates", "space_onboarding_content")}/**/*.yjs") do |yjs_file|
      create_document(yjs_file)
    end

  end

  private
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
