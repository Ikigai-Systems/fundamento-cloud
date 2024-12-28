class Documents::ReactionsController < ApplicationController
  layout "turbo_rails/frame"

  include LoadDocument

  after_action :verify_authorized

  before_action :load_document
  before_action :ensure_turbo_request, except: [:show]

  def index
    authorize @document, :show?

    @reactions_grouped = group_reactions
  end

  def create
    authorize @document, :show?

    @document.reactions.find_or_create_by!(
      organization: current_organization,
      organization_user: current_organization_user,
      emoji: params[:reaction][:emoji],
    )

    render html: "", status: :no_content
  end

  def show
    authorize @document, :show?

    @reaction = @document.reactions.find(params[:id])
    @reactions = @document.reactions.where(emoji: @reaction.emoji).order(created_at: :desc)
  end

  def destroy
    authorize @document, :show?

    @document.reactions.find_by(id: params[:id], organization_user: current_organization_user).destroy!

    render html: "", status: :no_content
  end

  protected

  def group_reactions
    @document.reactions.order(:emoji).group_by(&:emoji).transform_values do |reactions|
      count = reactions.size
      reaction = reactions.first
      destroyable = reactions.find { _1.organization_user == current_organization_user }

      [count, reaction, destroyable]
    end
  end

  def ensure_turbo_request
    redirect_to document_path(@document) unless turbo_frame_request?
  end
end
