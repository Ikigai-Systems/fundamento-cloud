class Favorite < ApplicationRecord
  include NpiOrdering

  belongs_to :organization_membership

  belongs_to :object, polymorphic: true

  validates_presence_of :object

  validates :object_type, inclusion: { in: %w[Document Table] }

  validates_uniqueness_of :object_id, scope: [:organization_membership_id, :object_type]

  broadcasts_to -> (favorite) { [ favorite.organization_membership, :favorites ] }, inserts_by: :prepend, target: "favorites_list"

  after_commit :broadcast_to_space_favorites, on: [:create, :destroy]

  private

  def broadcast_to_space_favorites
    space = object.try(:space)
    return unless space

    if destroyed?
      Turbo::StreamsChannel.broadcast_remove_to(
        [organization_membership, space, :favorites],
        target: self
      )
    else
      Turbo::StreamsChannel.broadcast_prepend_to(
        [organization_membership, space, :favorites],
        target: "space_starred_list",
        partial: "spaces/_sidebar/starred_item",
        locals: { favorite: self }
      )
    end
  end
end
