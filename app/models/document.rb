require 'open3'

class Document < ApplicationRecord
  include NpiOrdering
  include Trashable

  include ToReactProps
  set_react_props :id, :title, :icon, :color, :title_for_editing

  include HasIcon
  has_icon derived_from: :title

  include HasColor

  include TitleSearch
  searchable_by :title

  belongs_to :organization
  belongs_to :space

  # The Y.js CRDT blob, kept off this row so it cannot ride along with SELECT *.
  has_one :content, class_name: "ObjectContent", as: :owner, dependent: :destroy

  # Writers use this rather than #content: a document may predate the move to
  # object_contents, or have been created by a path that has not written content yet, so
  # the row is created lazily on first write.
  def content_or_build = content || build_content

  has_one :public_link, as: :object, dependent: :destroy

  has_many :versions, dependent: :destroy
  has_many :blocks, class_name: "DocumentBlock", dependent: :delete_all
  has_many :visitors, class_name: "ObjectVisitor", as: :object, dependent: :delete_all
  has_many :reactions, class_name: "ObjectReaction", as: :object, dependent: :delete_all
  has_many :comments, class_name: "ObjectComment", as: :object, dependent: :delete_all
  has_many :object_tags, as: :object, dependent: :delete_all
  has_many :tags, through: :object_tags
  has_many :inline_comment_threads, dependent: :destroy
  # An import file records which document it produced. Without this the foreign key makes an
  # imported document undeletable -- ActiveRecord::InvalidForeignKey on destroy, which also
  # stops TrashPurgeJob ever purging it. Nullified rather than destroyed: the import record is
  # history, and it stays truthful by saying the document it created is gone.
  has_many :import_files, dependent: :nullify
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
  after_destroy :remove_from_space_hierarchy

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

  # The blocks readers see: the live content of a draft, otherwise the latest saved version.
  def current_blocks
    draft? ? to_blocks : versions.last.content_blocks
  end

  # The blocks that have comments. A reader that sends the document back must keep their ids, or
  # the comments lose the block they are about.
  def commented_block_ids
    comments.anchored.distinct.pluck(:anchor_block_id)
  end

  # The text that comments on blocks quote, with the text around it, for marking it in the block.
  def comment_quotes
    comments.anchored.where(removed_at: nil).where.not(anchor_quote: [nil, ""])
      .pluck(:anchor_block_id, :anchor_quote, :anchor_prefix, :anchor_suffix)
      .map { |block_id, quote, prefix, suffix| {blockId: block_id, quote: quote, prefix: prefix.to_s, suffix: suffix.to_s} }
  end

  # The comments on blocks that are no longer in the document: those whose block the latest saved
  # version does not have. A draft has no saved version, so nothing is gone from it yet.
  def orphaned_comments
    latest_version_id = versions.maximum(:id)
    return comments.none unless latest_version_id

    comments.anchored.where.not(anchor_block_id: blocks.where(last_version_id: latest_version_id).select(:block_id))
  end

  # The latest saved version that still had each of these blocks, by block id. A block that was
  # never saved (it came and went within a draft) has no version.
  def latest_versions_with_blocks(block_ids)
    marks = blocks.where(block_id: block_ids).pluck(:block_id, :last_version_id)
    found = versions.where(id: marks.map(&:last).uniq).index_by(&:id)
    marks.to_h { |block_id, version_id| [block_id, found[version_id]] }
  end

  # The YAML frontmatter block the importers read back: `title`, then `tags` (names without a
  # leading #), `fundamento/icon` and `fundamento/color`, each only when present. Dumped by
  # Psych from a Hash, never interpolated, so awkward titles stay a single string value.
  def to_frontmatter
    data = {"title" => title}
    tag_names = tags.map(&:name).sort
    data["tags"] = tag_names if tag_names.any?
    data["fundamento/icon"] = icon.value if icon
    data["fundamento/color"] = color if color.present?

    "#{data.to_yaml}---\n\n"
  end

  def nullify_space_home_document_id
    return if space.home_document != self

    space.update(home_document: nil)
  end

  # Archives the children, grandchildren and so on, found through the space hierarchy.
  # Trashed documents are left alone. Returns how many descendants it archived.
  def archive_descendants!
    ids = space.get_all_descendant_ids(id)
    space.documents.where(id: ids, archived: false).update_all(archived: true, updated_at: Time.current)
  end

  def nullify_object_reference_targets
    ObjectReference.where(target_type: "Document", target_id: id, organization_id: organization_id)
                   .update_all(target_id: nil)
  end

  # The hierarchy node deliberately outlives *trashing* -- that is what lets untrashing
  # restore the document's original position and subtree without anything having had to
  # record them. It must not outlive the document itself: once the purge destroys the
  # record, a node pointing at it is garbage that renderers quietly tolerate while the
  # JSON grows for good.
  #
  # Removing it promotes the children into its place, which is the same thing the
  # renderers were already doing for a node they could not resolve.
  #
  # Skipped when the space is being destroyed anyway: the hierarchy goes with it, and
  # locking and rewriting it once per document would be wasted work.
  def remove_from_space_hierarchy
    return if destroyed_by_association
    return if space.nil?

    space.with_locked_hierarchy { |locked| locked.remove_single_item_from_hierarchy!(id) }
  end
end
