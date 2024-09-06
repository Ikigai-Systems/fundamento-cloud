class Team < ApplicationRecord
  belongs_to :organization

  validates_presence_of :name, :shortcut

  validates_uniqueness_of :name, scope: [:organization_id]
  validates_uniqueness_of :shortcut, scope: [:organization_id]
end
