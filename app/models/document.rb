require 'open3'

class Document < ApplicationRecord
  include NpiOrdering

  include ToReactProps
  set_react_props :id, :title

  include EmojiExtractable
  extracts_emoji_from :title

  belongs_to :organization
  belongs_to :space

  has_one :public_link, as: :object, dependent: :destroy

  has_many :versions, dependent: :destroy
  has_many :visitors, class_name: "ObjectVisitor", as: :object, dependent: :delete_all
  has_many :reactions, class_name: "ObjectReaction", as: :object, dependent: :delete_all
  has_many :comments, class_name: "ObjectComment", as: :object, dependent: :delete_all
  has_many :object_tags, as: :object, dependent: :delete_all
  has_many :tags, through: :object_tags
  has_many :inline_comment_threads, dependent: :destroy
  has_many :attachments, as: :parent, dependent: :destroy
  has_many :editing_sessions, class_name: "DocumentEditingSession", dependent: :delete_all
  has_many :source_object_references, class_name: "ObjectReference", as: :source, dependent: :delete_all

  def contributors
    User.joins(organization_memberships: :editing_sessions)
        .where(document_editing_sessions: { document_id: id })
        .distinct
        .order(:first_name, :last_name)
  end

  before_destroy :nullify_space_home_document_id
  before_destroy :nullify_object_reference_targets

  scope :archived, -> { where(archived: true) }
  scope :without_archived, -> { where(archived: false) }
  scope :with_has_versions, -> { select("documents.*, EXISTS (SELECT 1 FROM versions WHERE versions.document_id = documents.id) AS has_versions") }

  scope :recently_updated, -> { without_archived.order(updated_at: :desc).limit(50) }

  after_commit -> (document) {
    broadcast_action_to(
      [document.organization, "recently_updated"],
      action: :reload_turbo_frame,
      target: "#recently_updated_frame",
      render: false
    )
  }

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
    BlocknoteConverterService.yjs_to_blocks(sync)
  end

  def nullify_space_home_document_id
    return if space.home_document != self

    space.update(home_document: nil)
  end

  def nullify_object_reference_targets
    ObjectReference.where(target_type: "Document", target_id: id, organization_id: organization_id)
                   .update_all(target_id: nil)
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
