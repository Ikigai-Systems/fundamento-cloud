class AutomationsController < ApplicationController
  before_action :load_space

  after_action :verify_authorized_or_index_scoped

  def index
    @automations = policy_scope(@space.automations).order(:title)
  end

  def new
    @automation = @space.automations.new

    authorize @automation, :create?
  end

  def create
    @automation = @space.automations.new(automation_params)
    @automation.organization_id = @space.organization_id

    authorize @automation, :create?

    if @automation.save
      redirect_to space_automation_path(@space, @automation), notice: 'Automation was successfully created.'
    else
      render :new
    end
  end

  def show
    @automation = @space.automations.find_by_npi!(params[:npi])

    authorize @automation, :show?
  end

  def edit
    @automation = @space.automations.find_by_npi!(params[:npi])

    authorize @automation, :update?
  end

  protected

  def load_space
    @space = current_organization.spaces.find_by_npi!(params[:space_npi])
  end

  def automation_params
    params.require(:automation).permit(:title, :formula, :kind)
  end
end