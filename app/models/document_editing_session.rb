class DocumentEditingSession < ApplicationRecord
  include NpiOrdering

  belongs_to :document
  belongs_to :member, class_name: "OrganizationMembership", inverse_of: :editing_sessions
  belongs_to :version, optional: true

  scope :editors, -> { where(edited: true) }
  scope :unlinked, -> { where(version_id: nil) }
end
