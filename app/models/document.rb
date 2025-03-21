require 'open3'

class Document < ApplicationRecord
  include ModelWithNpiAsParam

  set_allow_fallback_to_id true
  set_attach_to_param :title

  include ToReactProps
  set_react_props :id, :npi, :title

  belongs_to :organization
  belongs_to :space

  has_one :public_link, as: :object, dependent: :destroy

  has_many :versions, dependent: :destroy
  has_many :visitors, class_name: "ObjectVisitor", as: :object, dependent: :delete_all
  has_many :reactions, class_name: "ObjectReaction", as: :object, dependent: :delete_all
  has_many :comments, class_name: "ObjectComment", as: :object, dependent: :delete_all

  before_destroy :nullify_space_home_document_id

  scope :archived, -> { where(archived: true) }
  scope :without_archived, -> { where(archived: false) }
  scope :with_has_versions, -> { select("documents.*, EXISTS (SELECT 1 FROM versions WHERE versions.document_id = documents.id) AS has_versions") }

  scope :recently_updated, -> { without_archived.order(updated_at: :desc).limit(50) }

  after_commit :broadcast_recently_updated_documents, on: [:create, :update, :destroy]

  def broadcast_recently_updated_documents
    broadcast_refresh_to ["recent_documents_list", self.organization]
  end

  def title
    super.presence || "Untitled"
    # [STE] - ask Pawel why do we need to provide default "Untitled" value instead of handling nil title by the callers
  end

  def as_json(options = {})
    super(options).tap do |hash|
      if hash.key?(:sync)
        hash[:sync] = Base64.encode64(hash[:sync])
      end
    end
  end

  def draft?
    if has_attribute?(:has_versions)
      !has_versions
    else
      self.versions.empty?
    end
  end

  def to_blocks
    # BlockNoteConverterRuby.to_blocks(sync)
    BlockNoteConverterNode.to_blocks(sync)
  end

  def nullify_space_home_document_id
    return if space.home_document != self

    space.update(home_document: nil)
  end

  def parent
    def get_parent_id_from_hierarchy(document_id, node)
      node.each do |item|
        item["children"].each do |child|
          return item["id"] if child["id"] == document_id
        end

        parent_id = get_parent_id_from_hierarchy(document_id, item["children"])
        return parent_id if parent_id.present?
      end

      nil
    end

    parent_id = get_parent_id_from_hierarchy(self.id, self.space.hierarchy)

    Document.find_by(id: parent_id)
  end
end
