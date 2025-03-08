class ReactionsController < ApplicationController
  layout "turbo_rails/frame"

  after_action :verify_authorized

  before_action :load_resource
  before_action :ensure_turbo_request, except: [:show]

  helper_method :resource
  helper_method :resource_reactions_path
  helper_method :resource_reaction_path

  def index
    authorize resource, :show?

    @reactions_grouped = group_reactions

    render "objects/reactions/index"
  end

  def create
    authorize resource, :show?

    resource.reactions.find_or_create_by!(
      organization: current_organization,
      organization_user: current_organization_user,
      emoji: params[:reaction][:emoji],
    )

    render html: "", status: :no_content
  end

  def show
    authorize resource, :show?

    @reaction = resource.reactions.find(params[:id])
    @reactions = resource.reactions.where(emoji: @reaction.emoji).order(created_at: :desc)

    render "objects/reactions/show"
  end

  def destroy
    authorize resource, :show?

    resource.reactions.find_by(id: params[:id], organization_user: current_organization_user).destroy!

    render html: "", status: :no_content
  end

  protected

  def group_reactions
    resource.reactions.order(:emoji).group_by(&:emoji).transform_values do |reactions|
      count = reactions.size
      reaction = reactions.first
      destroyable = reactions.find { _1.organization_user == current_organization_user }

      [count, reaction, destroyable]
    end
  end

  def ensure_turbo_request
    redirect_to polymorphic_path(resource) unless turbo_frame_request?
  end

  def load_resource
    if params[:object_gid]
      @resource = GlobalID::Locator.locate(params[:object_gid], only: ObjectReaction::ALLOWED_OBJECT_TYPES.map(&:constantize))

      if @resource.nil? || @resource.organization != current_organization
        return head :unprocessable_entity
      end
    else
      unless ObjectReaction::ALLOWED_OBJECT_TYPES.include?(params[:object_type])
        return head :unprocessable_entity
      end

      @resource = params[:object_type].constantize.
        find_by_param!(params[:object_id])
    end
  end

  def resource_reactions_path(resource)
    reactions_path(object_type: resource.class.to_s, object_id: resource.to_param)
  end

  def resource_reaction_path(resource, reaction)
    reaction_path(reaction, object_type: resource.class.to_s, object_id: resource.to_param)
  end

  def resource
    @resource
  end
end