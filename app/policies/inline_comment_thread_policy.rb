class InlineCommentThreadPolicy < ApplicationPolicy
  def show?
    Pundit.policy!(user_context, record.document).show?
  end

  def create?
    Pundit.policy!(user_context, record.document).update?
  end

  def update?
    Pundit.policy!(user_context, record.document).update?
  end

  def destroy?
    Pundit.policy!(user_context, record.document).update?
  end
end