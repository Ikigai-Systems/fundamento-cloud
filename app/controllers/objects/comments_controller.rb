class Objects::CommentsController < ApplicationController
  layout "turbo_rails/frame"

  after_action :verify_authorized

  before_action :load_resource
  before_action :ensure_turbo_request, except: [:show]

  helper_method :resource
  helper_method :resource_comments_path
  helper_method :resource_comment_path
  helper_method :new_resource_comment_path

  def index
    authorize resource, :show?

    @comments = load_comments

    render "objects/comments/index"
  end

  def create
    @comment = resource.comments.new(create_params)
    @comment.organization = current_organization
    @comment.organization_user = current_organization_user

    authorize resource, :create?

    if @comment.save
      redirect_to @comment, notice: 'Comment was successfully created.'
    else
      render :new
    end
  end

  def show
    authorize resource, :show?

    @reaction = resource.comments.find(params[:id])
    @comments = resource.comments.where(emoji: @reaction.emoji).order(created_at: :desc)

    render "objects/comments/show"
  end

  def new
    authorize resource, :create?

    @comment = resource.comments.new

    render "objects/comments/new"
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

  def new_resource_comment_path(resource)
    send("new_#{resource.model_name.singular_route_key}_comment_path", resource)
  end

  def ensure_turbo_request
    redirect_to polymorphic_path(resource) unless turbo_frame_request?
  end

  def create_params
    params.require(:comment).permit(:comment)
  end
end
