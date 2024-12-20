class Space < ApplicationRecord
  belongs_to :organization

  include ModelWithNpiAsParam
  include ToReactProps

  # Keep it in sync with app/javascript/types.ts
  set_react_props :npi, :name, :hierarchy

  has_many :automations, dependent: :destroy
  has_many :documents, dependent: :destroy
  has_many :space_memberships, dependent: :destroy
  has_many :tables, dependent: :destroy

  belongs_to :home_document, class_name: "Document", optional: true

  validates_presence_of :name
  validates_presence_of :home_document, if: -> { home_document_id.present? }

  validates_uniqueness_of :name, scope: [:organization_id]

  after_create :create_home_document

  enum :access_mode, [:public, :restricted, :private], suffix: true, validate: true

  def documents_from_hierarchy(starting_node = hierarchy)
    ids = traverse_hierarchy(starting_node)
    self.documents.where(id: ids)
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

  def create_home_document
    return if home_document_id.present?

    home_document = documents.create!(title: "Home for #{name}", organization: organization)

    update!(home_document: home_document)
  end
end
