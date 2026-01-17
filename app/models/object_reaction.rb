class ObjectReaction < ApplicationRecord
  ALLOWED_OBJECT_TYPES = %w[Document Table ObjectComment]

  belongs_to :organization
  belongs_to :organization_membership
  belongs_to :object, polymorphic: true

  after_commit -> (object_reaction) {
    broadcast_action_to(
      [:object_reactions, object_reaction.object],
      action: :reload_turbo_frame,
      target: "#" + ActionView::RecordIdentifier.dom_id(object_reaction.object, :reactions),
      render: false
    )
  }

  validates_presence_of :object
  validates :object_type, inclusion: { in: ALLOWED_OBJECT_TYPES }

  validates_presence_of :emoji
  validates_uniqueness_of :emoji, scope: [:object_id, :object_type, :organization_membership_id]
end