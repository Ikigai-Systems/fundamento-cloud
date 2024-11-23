class AutomationInvocationJob < ApplicationJob
  def perform(automation_invocation)
    invoked_at = Time.now

    additional_context = JSON.parse(automation_invocation.webhook)

    result = FormulaEvalGateway.evaluate(automation_invocation.formula, additional_context)

    automation_invocation.update!(invoked_at: invoked_at, result: result.to_json)
  rescue => e
    automation_invocation.update!(invoked_at: invoked_at, result: {
      error: e.to_s
    }.to_json)
  end
end