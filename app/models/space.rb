class Space < ApplicationRecord
  belongs_to :organization

  has_many :documents, dependent: :destroy
  has_many :tables, class_name: "Tables::Table", dependent: :destroy

  belongs_to :home_document, class_name: "Document", optional: true

  validates_presence_of :name

  def documents_from_hierarchy
    ids = traverse_hierarchy(hierarchy)
    organization.documents.find(ids)
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
end
