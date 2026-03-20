class CommentsController < ApplicationController
  include EnsureOrganization

  layout "turbo_rails/frame"

  after_action :verify_authorized

  before_action :load_resource
  before_action :ensure_turbo_request, except: [:show]

  def index
    authorize @resource, :show?

    @comments = load_comments
  end

  def new
    authorize @resource, :create?

    @comment = @resource.comments.new
  end

  def create
    @comment = @resource.comments.new(create_params)
    @comment.organization = current_organization
    @comment.organization_membership = current_organization_membership

    authorize @resource, :create?

    if @comment.save
      render turbo_stream: turbo_stream.update("new_object_comment", "")
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    @comment = @resource.comments.find(params[:id])
    authorize @comment

    @comment.update!(update_params)

    head :ok
  end

  def destroy
    @comment = @resource.comments.find(params[:id])
    authorize @comment

    @comment.update!(removed_at: Time.current)

    render html: "", status: :no_content
  end

  def restore
    @comment = @resource.comments.find(params[:id])
    authorize @comment

    @comment.update!(removed_at: nil)

    render html: "", status: :no_content
  end

  def show
    authorize @resource, :show?

    @reaction = @resource.comments.find(params[:id])
    @comments = @resource.comments.where(emoji: @reaction.emoji).order(created_at: :desc)
  end

  protected

  def load_comments
    @resource.comments.order(:created_at)
  end

  def ensure_turbo_request
    redirect_to polymorphic_path(@resource) unless turbo_frame_request?
  end

  def create_params
    params.require(:comment).permit(:content)
  end

  def update_params
    params.require(:comment).permit(:content)
  end

  def access_denied
    head :forbidden
  end

  def load_resource
    if params[:object_gid]
      @resource = GlobalID::Locator.locate(params[:object_gid], only: ObjectComment::ALLOWED_OBJECT_TYPES.map(&:constantize))

      if @resource.nil? || @resource.organization != current_organization
        return head :unprocessable_entity
      end
    else
      unless ObjectComment::ALLOWED_OBJECT_TYPES.include?(params[:object_type])
        return head :unprocessable_entity
      end

      @resource = params[:object_type].constantize.
        find_by_param!(params[:object_id])
    end
  end
end
