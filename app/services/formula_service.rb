class FormulaService
  # Proxy service that conditionally calls either FormulaEvalGateway or Formula::Engine
  # based on the ruby_formulas feature flag

  def self.evaluate(formula, space = nil, organization_user = nil, additional_context: {})
    if Flipper.enabled?(:ruby_formulas, organization_user&.user)
      # Use the new Ruby Formula::Engine
      evaluate_with_ruby_engine(formula, space, organization_user, additional_context)
    else
      # Use the existing microservice FormulaEvalGateway
      FormulaEvalGateway.evaluate(formula, space, organization_user, additional_context: additional_context)
    end
  end

  def self.batch_evaluate(evaluations, space = nil, organization_user = nil)
    if Flipper.enabled?(:ruby_formulas, organization_user&.user)
      # Use the new Ruby Formula::Engine for batch evaluation
      batch_evaluate_with_ruby_engine(evaluations, space, organization_user)
    else
      # Use the existing microservice FormulaEvalGateway
      FormulaEvalGateway.batch_evaluate(evaluations, space, organization_user)
    end
  end

  private

  def self.evaluate_with_ruby_engine(formula, space, organization_user, additional_context)
    begin
      # Prepare context similar to FormulaEvalGateway
      context = additional_context.dup

      pundit_user = PolicyUserContext.new(organization_user)

      # Create action executor for formula actions
      action_executor = Formula::ActionExecutor.new(
        dry_mode: false,
        space: space,
        organization_user: organization_user,
        additional_context: context
      )

      fundamento_functions = Formula::FundamentoFunctions.new(pundit_user:, space:)

      # Create and use Formula::Engine
      engine = Formula::Engine.new(additional_functions: action_executor.get_action_functions.merge(fundamento_functions.functions))
      result = engine.evaluate(formula, context: context, action_executor: action_executor)

      # Get executed actions from action_executor
      commands = action_executor.get_actions

      # Return format compatible with FormulaEvalGateway
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

  def self.batch_evaluate_with_ruby_engine(evaluations, space, organization_user)
    evaluations.map do |evaluation|
      evaluate_with_ruby_engine(
        evaluation[:formula], 
        space, 
        organization_user, 
        {}
      )
    end
  end
end