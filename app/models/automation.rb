class Automation < ApplicationRecord
  DEFAULT_INVOCATIONS_LIMIT = 5

  belongs_to :organization
  belongs_to :space
  belongs_to :run_as, class_name: "OrganizationUser", optional: true

  has_many :invocations, class_name: "AutomationInvocation", dependent: :delete_all

  validates_presence_of :title
  validates_uniqueness_of :title, scope: [:space_id]

  validates_presence_of :formula, if: -> { webhook? }

  enum :kind, [:webhook], scopes: false, validate: true

  def invocations_limit
    super.presence || DEFAULT_INVOCATIONS_LIMIT
  end
end