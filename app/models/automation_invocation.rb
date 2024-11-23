class AutomationInvocation < ApplicationRecord
  belongs_to :organization
  belongs_to :space
  belongs_to :automation

  enum :kind, [:webhook], scopes: false, validate: true
end