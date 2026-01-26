class Team < ApplicationRecord
  include NpiOrdering

  belongs_to :organization

  scope :query, ->(query) do
    return all if query.blank?
    
    where("(name || ' ' || shortcut) ILIKE ?", "%#{query}%")
  end

  has_many :team_memberships, dependent: :destroy

  validates_presence_of :name, :shortcut

  validates_uniqueness_of :name, scope: [:organization_id]
  validates_uniqueness_of :shortcut, scope: [:organization_id]

  validates_format_of :shortcut,
    with: /\A@[a-zA-Z][\w\-]*\z/,
    message: "must start with @ followed by a letter, and contain only ASCII characters, _ or -"
end
