class Automation < ApplicationRecord
  include NpiOrdering

  DEFAULT_INVOCATIONS_LIMIT = 5

  belongs_to :organization
  belongs_to :space

  # Webhooks run as the caller (see AutomationInvocation#run_as); this column was never read.
  # Ignored until a later migration drops it, so containers still on the old code keep working.
  self.ignored_columns += ["run_as_id"]

  has_many :invocations, class_name: "AutomationInvocation", dependent: :delete_all

  validates_presence_of :title
  validates_uniqueness_of :title, scope: [:space_id]

  validates_presence_of :formula, if: -> { webhook? }

  enum :kind, [:webhook], scopes: false, validate: true

  def invocations_limit
    super.presence || DEFAULT_INVOCATIONS_LIMIT
  end
end