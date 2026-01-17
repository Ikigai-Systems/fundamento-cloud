class ReactionsController < ApplicationController
  include EnsureOrganization

  layout "turbo_rails/frame"

  after_action :verify_authorized

  before_action :load_resource
  before_action :ensure_turbo_request, except: [:show]

  def index
    authorize @resource, :show?

    @reactions_grouped = group_reactions
  end

  def create
    authorize @resource, :show?

    @resource.reactions.find_or_create_by!(
      organization: current_organization,
      organization_membership: current_organization_membership,
      emoji: params[:reaction][:emoji],
    )

    render html: "", status: :no_content
  end

  def show
    authorize @resource, :show?

    @reaction = @resource.reactions.find(params[:id])
    @reactions = @resource.reactions.where(emoji: @reaction.emoji).order(created_at: :desc)
  end

  def destroy
    authorize @resource, :show?

    @resource.reactions.find_by(id: params[:id], organization_membership: current_organization_membership).destroy!

    render html: "", status: :no_content
  end

  protected

  def group_reactions
    @resource.reactions.order(:emoji).group_by(&:emoji).transform_values do |reactions|
      count = reactions.size
      reaction = reactions.first
      destroyable = reactions.find { _1.organization_membership == current_organization_membership }

      [count, reaction, destroyable]
    end
  end

  def ensure_turbo_request
    redirect_to polymorphic_path(@resource.object) unless turbo_frame_request?
  end

  def load_resource
    if params[:object_gid]
      @resource = GlobalID::Locator.locate(params[:object_gid], only: ObjectReaction::ALLOWED_OBJECT_TYPES.map(&:constantize))

      if @resource.nil? || @resource.organization != current_organization
        return head :unprocessable_content
      end
    else
      unless ObjectReaction::ALLOWED_OBJECT_TYPES.include?(params[:object_type])
        return head :unprocessable_content
      end

      @resource = params[:object_type].constantize.
        find_by_param!(params[:object_id])
    end
  end
end