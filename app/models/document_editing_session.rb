class DocumentEditingSession < ApplicationRecord
  belongs_to :document
  belongs_to :member, class_name: "OrganizationMembership"
  belongs_to :version, optional: true

  scope :editors, -> { where(edited: true) }
  scope :unlinked, -> { where(version_id: nil) }
end
