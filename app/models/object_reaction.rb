class ObjectReaction < ApplicationRecord
  belongs_to :organization
  belongs_to :organization_user
  belongs_to :object, polymorphic: true

  after_commit -> (object_reaction) {
    broadcast_action_to(
      [:object_reactions, object_reaction.object],
      action: :reload_turbo_frame,
      target: "#document_reactions",
      render: false
    )
  }

  validates_presence_of :emoji
  validates_uniqueness_of :emoji, scope: [:object_id, :object_type, :organization_user_id]
end