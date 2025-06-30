class InlineCommentsController < ApplicationController
  include EnsureOrganization

  # after_action :verify_authorized

  def add_comment_thread
    inline_comment_thread = InlineCommentThread.create(
      {
        id: params[:data][:thread_id],
        document_id: params[:document_id]
      }
    )

    params[:data][:comments].each do |comment|
      inline_comment_thread.inline_comments.create!(
        {
          id: comment[:comment_id],
          content: comment[:content],
          organization_user: current_organization_user
        }
      )
    end

    respond_to do |format|
      format.json { render json: {
        thread_id: inline_comment_thread.id,
        comments: inline_comment_thread.inline_comments.map do |comment|
          {
            comment_id: comment.id,
            content: comment.content,
            author_id: comment.organization_user.id,
            created_at: comment.created_at
          }
        end
      } }
      format.all { head :unprocessable_content }
    end
  end
end
