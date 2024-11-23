class Api::V1::AutomationsController < Api::ApiController
  before_action :load_automation

  def invoke
    unless @automation.webhook?
      render json: nil, status: :precondition_failed
      return
    end

    invocation = @automation.invocations.create!(
      organization_id: @automation.organization_id,
      space_id: @automation.space_id,
      kind: @automation.kind,
      formula: @automation.formula
    )

    render json: { id: invocation.id }, status: :created
  end

  private

  def load_automation
    @automation = Automation.find_by_npi!(params[:npi])
  end

end