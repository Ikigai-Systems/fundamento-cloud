class Documents::ReactionsController < ApplicationController
  layout -> { turbo_frame_request? ? "turbo_rails/frame" : "content_two_sidebars" }

  include LoadDocument

  after_action :verify_authorized

  before_action :load_document
  before_action :ensure_turbo_request

  def index
    authorize @document, :show?

    @reactions = @document.reactions
  end

  def create
    authorize @document, :show?

    @document.reactions.create!(
      organization: current_organization,
      organization_user: current_organization_user,
      emoji: params[:reaction][:emoji],
    )

    @reactions = @document.reactions

    render :index
  end

  def destroy
    authorize @document, :show?

    @document.reactions.find_by(id: params[:id], organization_user: current_organization_user).destroy!

    @reactions = @document.reactions

    render :index
  end

  protected

  def ensure_turbo_request
    redirect_to document_path(@document) unless turbo_frame_request?
  end
end
