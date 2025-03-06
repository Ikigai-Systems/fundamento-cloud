class ObjectComment < ApplicationRecord
  belongs_to :organization
  belongs_to :organization_user
  belongs_to :object, polymorphic: true

  after_commit -> (object_comment) {
    broadcast_action_to(
      [:object_comments, object_comment.object],
      action: :reload_turbo_frame,
      target: "#object_comments",
      render: false
    )
  }

  validates_presence_of :comment

  def comment
    # FIXME: workaround for serialization problem
    comment = super
    if comment.is_a?(String)
      JSON.parse(comment)
    else
      comment
    end
  end
end