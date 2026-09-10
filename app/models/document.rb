require 'open3'

class Document < ApplicationRecord
  include NpiOrdering

  include ToReactProps
  set_react_props :id, :title, :icon, :title_for_editing

  include HasIcon
  has_icon derived_from: :title

  include TitleSearch
  searchable_by :title

  belongs_to :organization
  belongs_to :space

  # The Y.js CRDT blob, kept off this row so it cannot ride along with SELECT *.
  # See docs/superpowers/specs/2026-09-09-object-contents-design.md.
  has_one :content, class_name: "ObjectContent", as: :owner, dependent: :destroy

  # Writers use this rather than #content: a document may predate the move to
  # object_contents, or have been created by a path that has not written content yet, so
  # the row is created lazily on first write.
  def content_or_build = content || build_content

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

  def draft?
    if has_attribute?(:has_versions)
      !has_versions
    else
      self.versions.empty?
    end
  end

  def to_blocks
    BlocknoteConverterService.yjs_to_blocks(content&.sync)
  end

  def nullify_space_home_document_id
    return if space.home_document != self

    space.update(home_document: nil)
  end

  def nullify_object_reference_targets
    ObjectReference.where(target_type: "Document", target_id: id, organization_id: organization_id)
                   .update_all(target_id: nil)
  end
end
