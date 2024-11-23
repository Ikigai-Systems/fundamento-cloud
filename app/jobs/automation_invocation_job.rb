class AutomationInvocationJob < ApplicationJob
  def perform(automation_invocation)
    automation_invocation.update!(invoked_at: Time.now)
  end
end