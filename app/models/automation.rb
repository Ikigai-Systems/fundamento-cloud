class Automation < ApplicationRecord
  belongs_to :organization
  belongs_to :space

  has_many :invocations, class_name: "AutomationInvocation", dependent: :delete_all

  validates_presence_of :title
  validates_uniqueness_of :title, scope: [:space_id]

  enum :kind, [:webhook], scopes: false, validate: true
end