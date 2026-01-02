class Favorite < ApplicationRecord
  include NpiOrdering

  belongs_to :organization_user

  belongs_to :object, polymorphic: true

  validates_presence_of :object

  validates :object_type, inclusion: { in: %w[Document Table] }

  validates_uniqueness_of :object_id, scope: [:organization_user_id, :object_type]

  broadcasts_to -> (favorite) { [ favorite.organization_user, :favorites ] }, inserts_by: :prepend, target: "favorites_list"
end
