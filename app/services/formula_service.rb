class FormulaService
  # Service that uses Formula::Engine for formula evaluation

  def self.evaluate(formula, space = nil, organization_membership = nil, additional_context: {})
    begin
      # Prepare context
      context = additional_context.dup

      pundit_user = PolicyUserContext.new(organization_membership)

      # Create action executor for formula actions
      action_executor = Formula::ActionExecutor.new(
        dry_mode: false,
        space: space,
        organization_membership: organization_membership,
        additional_context: context
      )

      fundamento_functions = Formula::FundamentoFunctions.new(pundit_user:, space:)

      # Create and use Formula::Engine
      engine = Formula::Engine.new(additional_functions: action_executor.get_action_functions.merge(fundamento_functions.functions))
      result = engine.evaluate(formula, context: context, action_executor: action_executor)

      # Get executed actions from action_executor
      commands = action_executor.get_actions

      {
        "result" => result,
        "commands" => commands
      }
    rescue => e
      Rails.logger.error e.message
      Rails.logger.error e.backtrace.join("\n")

      {
        "error" => "Unable to evaluate formula due to error: #{e.message}"
      }
    end
  end

  def self.batch_evaluate(evaluations, space = nil, organization_membership = nil)
    evaluations.map do |evaluation|
      evaluate(
        evaluation[:formula],
        space,
        organization_membership,
        additional_context: evaluation[:additional_context],
      )
    end
  end
end