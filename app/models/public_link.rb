class PublicLink < ApplicationRecord
  belongs_to :organization
  belongs_to :object, polymorphic: true
  belongs_to :updated_by, class_name: "User", optional: true

  include ModelWithNpi

  validates_presence_of :object

  validates :object_type, inclusion: { in: %w[Document] }

  validates_uniqueness_of :object_id, scope: [:organization_id, :object_type]
end
