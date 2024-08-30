class PublicLink < ApplicationRecord
  belongs_to :organization
  belongs_to :object, polymorphic: true
  belongs_to :updated_by, class_name: "User", optional: true

  validates_presence_of :npi

  validates_presence_of :object

  validates :object_type, inclusion: { in: %w[Document] }

  validates_uniqueness_of :object_id, scope: [:organization_id, :object_type]

  before_validation :generate_npi, on: :create

  def generate_npi
    self.npi = Nanoid.generate(size: 10)
  end
end
