class Automation < ApplicationRecord
  belongs_to :organization
  belongs_to :space

  validates_presence_of :title
  validates_uniqueness_of :title, scope: [:space_id]

  enum :kind, [:webhook], scopes: false, validate: true
end