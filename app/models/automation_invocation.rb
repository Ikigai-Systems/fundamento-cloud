class AutomationInvocation < ApplicationRecord
  belongs_to :organization
  belongs_to :space
  belongs_to :automation

  enum :kind, [:webhook], scopes: false, validate: true

  scope :recently_invoked, -> { order(invoked_at: :desc) }

  broadcasts_to -> (invocation) { [ invocation.space, invocation.automation, :invocations ] }, inserts_by: :prepend, partial: "automations/invocation"
end