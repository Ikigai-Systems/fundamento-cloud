class Api::V1::AutomationInvocationsController < Api::ApiController
  before_action :load_automation

  def create
    logger.tagged(@automation.npi) do
      unless @automation.webhook?
        render json: nil, status: :precondition_failed
        return
      end

      if @automation.debug_at.present?
        logger.info("Received webhook automation request")

        # Check for the Authorization header
        auth_header = request.headers['Authorization']
        if auth_header.present?
          last_four = auth_header[-4..-1]
          logger.info "Authorization header present. Last 4 characters: #{last_four}"
        else
          logger.info "Authorization header not present."
        end

        logger.info "Request Content-Type: #{request.content_type}"
        logger.info "Request Body: #{request.raw_post}"
        logger.info "Request Method: #{request.request_method}"
        logger.info "User Agent: #{request.user_agent}"
      end


      # If we ever get to a point this gives us memory bloat refer to CLK webhooks processing for a memory optimized version
      invocation = @automation.invocations.create!(
        organization_id: @automation.organization_id,
        space_id: @automation.space_id,
        run_as: current_organization_user,
        kind: @automation.kind,
        formula: @automation.formula,
        webhook: request.raw_post
      )

      AutomationInvocationJob.perform_later(invocation)

      render json: { id: invocation.id }, status: :created
    end
  end

  private

  def load_automation
    @automation = Automation.find(params[:automation_npi])
  end

end