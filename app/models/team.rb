class Team < ApplicationRecord
  belongs_to :organization

  has_many :users, through: :team_memberships, dependent: :destroy

  validates_presence_of :name, :shortcut

  validates_uniqueness_of :name, scope: [:organization_id]
  validates_uniqueness_of :shortcut, scope: [:organization_id]
end
