class Favorite < ApplicationRecord
  belongs_to :organization_user

  belongs_to :object, polymorphic: true

  include ModelWithNpiAsParam

  validates_presence_of :object

  validates :object_type, inclusion: { in: %w[Document Table] }

  validates_uniqueness_of :object_id, scope: [:organization_user_id, :object_type]
end
