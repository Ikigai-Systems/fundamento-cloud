class InlineCommentPolicy < ApplicationPolicy
  def show?
    Pundit.policy!(user_context, record.inline_comment_thread.document).show?
  end

  def create?
    Pundit.policy!(user_context, record.inline_comment_thread.document).update?
  end

  def update?
    Pundit.policy!(user_context, record.inline_comment_thread.document).update?
  end

  def destroy?
    Pundit.policy!(user_context, record.inline_comment_thread.document).update?
  end
end