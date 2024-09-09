class SpaceMembership < ApplicationRecord
  self.primary_key = [:space_id, :manager_id, :manager_type]

  belongs_to :space
  belongs_to :member, polymorphic: true
end