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

  def create
    @comment = @resource.comments.new(create_params)
    @comment.organization = current_organization
    @comment.organization_user = current_organization_user

    authorize @resource, :create?

    if @comment.save
      render turbo_stream: turbo_stream.update(ObjectComment.new, "")
    else
      render :new, status: :unprocessable_entity
    end
  end

  def show
    authorize @resource, :show?

    @reaction = @resource.comments.find(params[:id])
    @comments = @resource.comments.where(emoji: @reaction.emoji).order(created_at: :desc)
  end

  def new
    authorize @resource, :create?

    @comment = @resource.comments.new
  end

  def destroy
    authorize @resource, :show?

    @resource.comments.find_by(id: params[:id], organization_user: current_organization_user).destroy!

    render html: "", status: :no_content
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
