class Space < ApplicationRecord
  belongs_to :organization

  include ModelWithNpiAsParam

  has_many :documents, dependent: :destroy
  has_many :tables, class_name: "Tables::Table", dependent: :destroy

  has_many :space_memberships, dependent: :destroy

  belongs_to :home_document, class_name: "Document", optional: true

  validates_presence_of :name
  validates_presence_of :home_document, if: -> { home_document_id.present? }

  after_create :create_home_document

  enum :access_mode, [:public, :restricted, :private], suffix: true, validate: true

  def documents_from_hierarchy
    ids = traverse_hierarchy(hierarchy)
    self.documents.where(id: ids)
  end

  def remove_document_from_hierarchy(document_id, node = hierarchy)
    document_id = document_id.to_i

    node.each_with_index do |item, index|
      if item["id"] == document_id
        node.delete_at(index)
        item["children"].each do |child|
          node.insert(index, child)
        end
      end
      remove_document_from_hierarchy(document_id, item["children"])
    end
  end

  private
  def traverse_hierarchy(node)
    ids = []
    (node || []).each do |item|
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
