class AutomationInvocationJob < ApplicationJob
  def perform(automation_invocation)
    # Automations mutate tables through formula actions; attribute those writes to the
    # membership the automation runs as rather than leaving them unattributed.
    Current.user = automation_invocation.run_as&.user

    Current.with_change_source("formula") do
      automation_invocation.invoke!
    end
  end
end
