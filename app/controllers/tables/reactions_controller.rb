class Tables::ReactionsController < ApplicationController
  include LoadTable.from_param(:table_npi)

  layout "turbo_rails/frame"

  after_action :verify_authorized

  before_action :load_table
  before_action :ensure_turbo_request, except: [:show]

  def index
    authorize @table, :show?

    @reactions_grouped = group_reactions
  end

  def create
    authorize @table, :show?

    @table.reactions.find_or_create_by!(
      organization: current_organization,
      organization_user: current_organization_user,
      emoji: params[:reaction][:emoji],
    )

    render html: "", status: :no_content
  end

  def show
    authorize @table, :show?

    @reaction = @table.reactions.find(params[:id])
    @reactions = @table.reactions.where(emoji: @reaction.emoji).order(created_at: :desc)
  end

  def destroy
    authorize @table, :show?

    @table.reactions.find_by(id: params[:id], organization_user: current_organization_user).destroy!

    render html: "", status: :no_content
  end

  protected

  def group_reactions
    @table.reactions.order(:emoji).group_by(&:emoji).transform_values do |reactions|
      count = reactions.size
      reaction = reactions.first
      destroyable = reactions.find { _1.organization_user == current_organization_user }

      [count, reaction, destroyable]
    end
  end

  def ensure_turbo_request
    redirect_to table_path(@table) unless turbo_frame_request?
  end
end
