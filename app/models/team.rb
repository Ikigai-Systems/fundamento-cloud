class Team < ApplicationRecord
  belongs_to :organization

  include ModelWithNpiAsParam

  has_many :team_memberships, dependent: :destroy
  has_many :users, through: :team_memberships, dependent: :destroy

  validates_presence_of :name, :shortcut

  validates_uniqueness_of :name, scope: [:organization_id]
  validates_uniqueness_of :shortcut, scope: [:organization_id]

  validates_format_of :shortcut,
    with: /\A@[a-zA-Z][\w\-]*\z/,
    message: "must start with @ followed by a letter, and contain only ASCII characters, _ or -"
end
