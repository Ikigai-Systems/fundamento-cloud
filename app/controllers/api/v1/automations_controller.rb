class Api::V1::AutomationsController < Api::ApiController
  before_action :load_automation

  private

  def load_automation
    @automation = Automation.find(params[:id])
  end
end