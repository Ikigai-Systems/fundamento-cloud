class AutomationInvocation < ApplicationRecord
  belongs_to :organization
  belongs_to :space
  belongs_to :automation

  enum :kind, [:webhook], scopes: false, validate: true

  scope :recently_invoked, -> { order(invoked_at: :desc) }

  broadcasts_to -> (invocation) { [ invocation.space, invocation.automation, :invocations ] }, inserts_by: :prepend, partial: "automations/invocation"

  def invoke!
    invoked_at = Time.now

    additional_context = JSON.parse(self.webhook)

    result = FormulaEvalGateway.evaluate(self.formula, additional_context: additional_context)

    self.update!(invoked_at: invoked_at, result: result.to_json)
  rescue => e
    self.update!(invoked_at: invoked_at, result: {
      error: e.to_s
    }.to_json)
  end
end