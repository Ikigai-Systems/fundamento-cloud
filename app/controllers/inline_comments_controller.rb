class InlineCommentsController < ApplicationController
  include EnsureOrganization

  after_action :verify_authorized

  def add_comment_thread
    inline_comment_thread = InlineCommentThread.new(
      {
        id: params[:thread_id],
        document_id: params[:document_id]
      }
    )

    authorize inline_comment_thread, :create?

    inline_comment_thread.save

    params[:comments].each do |comment|
      inline_comment_thread.inline_comments.create!(
        {
          id: comment[:comment_id],
          content: comment[:content],
          user: current_organization_membership.user,
          comment_attributes: comment[:attributes],
        }
      )
    end

    respond_to do |format|
      format.json { render json: render_comment_thread(inline_comment_thread) }
      format.all { head :unprocessable_content }
    end
  end

  def get_comment_thread
    inline_comment_thread = InlineCommentThread.find(params[:thread_id])

    authorize inline_comment_thread, :show?

    respond_to do |format|
      format.json { render json: render_comment_thread(inline_comment_thread) }
      format.all { head :unprocessable_content }
    end
  end

  def remove_comment_thread
    inline_comment_thread = InlineCommentThread.find(params[:thread_id])

    authorize inline_comment_thread, :destroy?

    inline_comment_thread.delete

    head :no_content
  end

  def resolve_comment_thread
    inline_comment_thread = InlineCommentThread.find(params[:thread_id])

    authorize inline_comment_thread, :update?

    inline_comment_thread.update(
      {
        resolved_at: DateTime.now,
        resolved_by: current_organization_membership.user.id
      }
    )

    respond_to do |format|
      format.json { render json: render_comment_thread(inline_comment_thread) }
      format.all { head :unprocessable_content }
    end
  end

  def reopen_comment_thread
    inline_comment_thread = InlineCommentThread.find(params[:thread_id])

    authorize inline_comment_thread, :update?

    inline_comment_thread.update(
      {
        resolved_at: nil,
        resolved_by: nil
      }
    )

    head :no_content
  end

  def add_comment
    comment = InlineComment.new(
      {
        id: params[:comment_id],
        inline_comment_thread_id: params[:thread_id],
        content: params[:content],
        comment_attributes: params[:attributes],
        user: current_organization_membership.user
      }
    )

    authorize comment, :create?

    comment.save

    respond_to do |format|
      format.json { render json: render_comment(comment) }
      format.all { head :unprocessable_content }
    end
  end

  def update_comment
    comment = InlineComment.find(params[:comment_id])

    authorize comment, :update?

    comment.update(
      Hash.new.tap do |attributes_to_update|
        attributes_to_update[:content] = params[:content] if params[:content].present?
        attributes_to_update[:comment_attributes] = params[:attributes] if params[:attributes].present?
      end
    )

    respond_to do |format|
      format.json { render json: render_comment(comment) }
      format.all { head :unprocessable_content }
    end
  end

  def remove_comment
    comment = InlineComment.find(params[:comment_id])

    authorize comment, :destroy?

    comment.delete

    head :no_content
  end

  private

  def render_comment_thread(comment_thread)
    visible_comments = comment_thread.inline_comments.filter do |inline_comment|
      inline_comment.comment_attributes&.[]("is_private") != true || inline_comment.user == current_user
    end

    if visible_comments.empty?
      return {
        thread_id: comment_thread.id,
        comments: [],
        resolved_at: DateTime.now,
        resolved_by: current_user.id,
      }
    end

    {
      thread_id: comment_thread.id,
      comments: visible_comments.map { |comment| render_comment(comment) },
      resolved_at: comment_thread.resolved_at,
      resolved_by: comment_thread.resolved_by
    }
  end

  def render_comment(comment)
    {
      comment_id: comment.id,
      content: comment.content,
      author_id: comment.user.id.to_s,
      created_at: comment.created_at,
      attributes: comment.comment_attributes,
    }
  end
end
