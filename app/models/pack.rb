class Pack < ApplicationRecord
  include NpiOrdering

  belongs_to :organization

  belongs_to :active_version, class_name: "PackVersion", optional: true

  has_many :versions, class_name: "PackVersion", dependent: :destroy

  # active_version_id is a foreign key into the versions destroyed above, so it has to let go
  # first. Prepended because dependent: :destroy is itself a before_destroy callback, and
  # callbacks run in declaration order.
  before_destroy :release_active_version, prepend: true

  # has_many :team_memberships, dependent: :destroy
  # has_many :users, through: :team_memberships, dependent: :destroy

  validates_presence_of :name

  validates_uniqueness_of :name, scope: [:organization_id]

  private

  def release_active_version
    update_column(:active_version_id, nil) if active_version_id
  end
end
