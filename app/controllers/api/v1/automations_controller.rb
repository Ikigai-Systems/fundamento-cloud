class Api::V1::AutomationsController < Api::ApiController
  before_action :load_automation

  private

  def load_automation
    @automation = Automation.find_by_npi!(params[:npi])
  end

end