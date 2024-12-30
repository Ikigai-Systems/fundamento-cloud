class Objects::ReactionsController < ApplicationController
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

  def resource_reactions_path(resource)
    send("#{resource.model_name.singular_route_key}_reactions_path", resource)
  end

  def resource_reaction_path(resource, reaction)
    send("#{resource.model_name.singular_route_key}_reaction_path", resource, reaction)
  end

  def ensure_turbo_request
    redirect_to polymorphic_path(resource) unless turbo_frame_request?
  end
end
