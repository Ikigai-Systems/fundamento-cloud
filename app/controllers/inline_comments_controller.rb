class InlineCommentsController < ApplicationController
  include EnsureOrganization

  # after_action :verify_authorized

  def add_comment_thread
    inline_comment_thread = InlineCommentThread.create(
      {
        id: params[:thread_id],
        document_id: params[:document_id]
      }
    )

    params[:comments].each do |comment|
      inline_comment_thread.inline_comments.create!(
        {
          id: comment[:comment_id],
          content: comment[:content],
          organization_user: current_organization_user
        }
      )
    end

    respond_to do |format|
      format.json { render json: render_comment_thread(inline_comment_thread) }
      format.all { head :unprocessable_content }
    end
  end

  def get_comment_thread
    inline_comment_thread = InlineCommentThread.find(params[:id])
    respond_to do |format|
      format.json { render json: render_comment_thread(inline_comment_thread) }
      format.all { head :unprocessable_content }
    end
  end

  def add_comment
    comment = InlineComment.create(
      {
        id: params[:comment_id],
        inline_comment_thread_id: params[:id],
        content: params[:content],
        organization_user: current_organization_user
      }
    )

    respond_to do |format|
      format.json { render json: render_comment(comment) }
      format.all { head :unprocessable_content }
    end
  end

  private

  def render_comment_thread(comment_thread)
    {
      thread_id: comment_thread.id,
      comments: comment_thread.inline_comments.map { |comment| render_comment(comment) }
    }
  end

  def render_comment(comment)
    {
      comment_id: comment.id,
      content: comment.content,
      author_id: comment.organization_user.id.to_s, # CKEditor requires author_id to be a string
      created_at: comment.created_at
    }
  end
end
