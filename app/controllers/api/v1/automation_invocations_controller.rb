class Api::V1::AutomationInvocationsController < Api::ApiController
  before_action :load_automation

  def create
    unless @automation.webhook?
      render json: nil, status: :precondition_failed
      return
    end

    # If we ever get to a point this gives us memory bloat refer to CLK webhooks processing for a memory optimized version
    invocation = @automation.invocations.create!(
      organization_id: @automation.organization_id,
      space_id: @automation.space_id,
      kind: @automation.kind,
      formula: @automation.formula,
      webhook: request.raw_post
    )

    AutomationInvocationJob.perform_later(invocation)

    render json: { id: invocation.id }, status: :created
  end

  private

  def load_automation
    @automation = Automation.find_by_npi!(params[:automation_npi])
  end

end