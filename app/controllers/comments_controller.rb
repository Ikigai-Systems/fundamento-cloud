class CommentsController < ApplicationController
  include EnsureOrganization

  layout "turbo_rails/frame"

  ANCHOR_PARAMS = %i[anchor_block_id anchor_quote anchor_prefix anchor_suffix anchor_text].freeze

  after_action :verify_authorized

  before_action :load_resource

  helper_method :comments_frame_id
  before_action :ensure_turbo_request, except: [:show]

  def index
    authorize @resource, :show?

    @comments = load_comments
  end

  def new
    authorize @resource, :create?

    @comment = @resource.comments.new(anchor_params)
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

  # The frame the list is in, which a block's comments have to themselves so that adding or
  # editing one reloads that block and not the document's list.
  def comments_frame_id
    ObjectComment.frame_id_for(params[:block_id])
  end

  # The comments on the document, or those on one of its blocks when a block is named. A block's
  # comments are not part of the document's list: they are shown where the block is.
  def load_comments
    comments = params[:block_id].present? ? @resource.comments.on_block(params[:block_id]) : @resource.comments.unanchored
    comments.order(:created_at)
  end

  def ensure_turbo_request
    redirect_to polymorphic_path(@resource) unless turbo_frame_request?
  end

  def create_params
    params.require(:comment).permit(:content, *ANCHOR_PARAMS)
  end

  # What the form that starts a comment on a block carries over to the one that saves it.
  def anchor_params
    params.permit(*ANCHOR_PARAMS)
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
