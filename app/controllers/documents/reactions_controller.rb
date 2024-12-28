class Documents::ReactionsController < ApplicationController
  layout -> { turbo_frame_request? ? "turbo_rails/frame" : "content_two_sidebars" }

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

    @reactions_grouped = group_reactions

    render :index
  end

  def show
    authorize @document, :show?

    render layout: "turbo_rails/frame"
  end

  def destroy
    authorize @document, :show?

    @document.reactions.find_by(id: params[:id], organization_user: current_organization_user).destroy!

    @reactions_grouped = group_reactions

    render :index
  end

  protected

  def group_reactions
    @document.reactions.group_by(&:emoji).transform_values do |reactions|
      count = reactions.size
      destroyable = reactions.first { _1.organization_user == current_organization_user }

      [count, destroyable]
    end
  end

  def ensure_turbo_request
    redirect_to document_path(@document) unless turbo_frame_request?
  end
end
