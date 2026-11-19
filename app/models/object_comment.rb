class ObjectComment < ApplicationRecord
  include NpiOrdering

  ALLOWED_OBJECT_TYPES = %w[Document Table]

  # What a comment on a block remembers about it: the text it quoted, the text around that, and
  # the block's own text. Enough to say what a comment was about when its block is gone, not
  # a copy of the document, so each is cut to this.
  ANCHOR_TEXT_LIMIT = 2000
  ANCHOR_TEXT_FIELDS = %i[anchor_quote anchor_prefix anchor_suffix anchor_text].freeze

  belongs_to :organization
  belongs_to :organization_membership
  belongs_to :object, polymorphic: true

  has_many :reactions, class_name: "ObjectReaction", as: :object, dependent: :delete_all

  # A comment on a block lives in that block's own frame, so one added there reloads that frame
  # and not the document's list.
  after_commit -> (object_comment) {
    broadcast_action_to(
      [:object_comments, object_comment.object],
      action: :reload_turbo_frame,
      target: "##{object_comment.comments_frame_id}",
      render: false
    )
  }

  scope :anchored, -> { where.not(anchor_block_id: nil) }
  scope :unanchored, -> { where(anchor_block_id: nil) }
  scope :on_block, ->(block_id) { where(anchor_block_id: block_id) }

  before_validation :normalize_anchor

  validates_presence_of :object
  validates :object_type, inclusion: { in: ALLOWED_OBJECT_TYPES }

  after_create :reconcile_object_references
  after_update :reconcile_object_references, unless: :removed?
  before_destroy :delete_object_references

  validates_presence_of :content

  # Only a document has blocks to comment on, and the rest of the anchor means nothing without
  # the block it belongs to.
  validate :anchor_belongs_to_a_document_block

  def removed?
    removed_at.present?
  end

  # A comment on one block of a document, as opposed to a comment on the document.
  def anchored?
    anchor_block_id.present?
  end

  # The Turbo frame that lists this comment: the document's, or that of its block.
  def self.frame_id_for(block_id)
    block_id.present? ? "object_comments_block_#{block_id}" : "object_comments"
  end

  def comments_frame_id
    self.class.frame_id_for(anchor_block_id)
  end

  # The frame the form that starts a comment opens in: the document's, or that of its block.
  def self.new_frame_id_for(block_id)
    block_id.present? ? "new_object_comment_block_#{block_id}" : "new_object_comment"
  end

  def content
    # FIXME: workaround for serialization problem
    content = super
    if content.is_a?(String)
      JSON.parse(content)
    else
      content
    end
  end

  private

  # A form sends an empty field for what was not filled in, and the block's text can be long.
  def normalize_anchor
    self.anchor_block_id = anchor_block_id.presence

    ANCHOR_TEXT_FIELDS.each do |field|
      value = self[field].presence
      self[field] = value&.truncate(ANCHOR_TEXT_LIMIT, omission: "")
    end
  end

  def anchor_belongs_to_a_document_block
    if anchored?
      errors.add(:anchor_block_id, "can only be set on a comment on a document") unless object_type == "Document"
    elsif ANCHOR_TEXT_FIELDS.any? { |field| self[field].present? }
      errors.add(:anchor_block_id, "can't be blank when the comment quotes a block")
    end
  end

  def reconcile_object_references
    ObjectReferenceReconciler.reconcile_comment(self)
  end

  def delete_object_references
    ObjectReference.where(source_comment_id: id).delete_all
  end
end