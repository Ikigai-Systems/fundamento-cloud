class Objects::CommentsController < ApplicationController
  layout "turbo_rails/frame"

  after_action :verify_authorized

  before_action :load_resource
  before_action :ensure_turbo_request, except: [:show]

  helper_method :resource
  helper_method :resource_comments_path
  helper_method :resource_comment_path

  def index
    authorize resource, :show?

    @comments = load_comments

    render "objects/comments/index"
  end

  def create
    authorize resource, :show?

    resource.comments.find_or_create_by!(
      organization: current_organization,
      organization_user: current_organization_user,
      emoji: params[:reaction][:emoji],
    )

    render html: "", status: :no_content
  end

  def show
    authorize resource, :show?

    @reaction = resource.comments.find(params[:id])
    @comments = resource.comments.where(emoji: @reaction.emoji).order(created_at: :desc)

    render "objects/comments/show"
  end

  def destroy
    authorize resource, :show?

    resource.comments.find_by(id: params[:id], organization_user: current_organization_user).destroy!

    render html: "", status: :no_content
  end

  protected

  def load_comments
    resource.comments.order(:created_at)
  end

  def resource_comments_path(resource)
    send("#{resource.model_name.singular_route_key}_comments_path", resource)
  end

  def resource_comment_path(resource, reaction)
    send("#{resource.model_name.singular_route_key}_comment_path", resource, reaction)
  end

  def ensure_turbo_request
    redirect_to polymorphic_path(resource) unless turbo_frame_request?
  end
end
