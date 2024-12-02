class AutomationInvocationJob < ApplicationJob
  def perform(automation_invocation)
    automation_invocation.invoke!
  end
end