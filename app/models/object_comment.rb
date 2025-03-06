class ObjectComment < ApplicationRecord
  ALLOWED_OBJECT_TYPES = %w[Document Table]

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

  validates_presence_of :object
  validates :object_type, inclusion: { in: ALLOWED_OBJECT_TYPES }

  validates_presence_of :content

  def content
    # FIXME: workaround for serialization problem
    content = super
    if content.is_a?(String)
      JSON.parse(content)
    else
      content
    end
  end
end