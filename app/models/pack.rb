class Pack < ApplicationRecord
  belongs_to :organization

  belongs_to :active_version, class_name: "PackVersion", optional: true

  has_many :versions, class_name: "PackVersion", dependent: :destroy

  include ModelWithNpiAsParam

  # has_many :team_memberships, dependent: :destroy
  # has_many :users, through: :team_memberships, dependent: :destroy

  validates_presence_of :name

  validates_uniqueness_of :name, scope: [:organization_id]
end
