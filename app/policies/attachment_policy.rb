class AttachmentPolicy < ApplicationPolicy
  def show?
    Pundit.policy!(user_context, record.parent).show?
  end

  def create?
    Pundit.policy!(user_context, record.parent).update?
  end

  def update?
    Pundit.policy!(user_context, record.parent).update?
  end

  def destroy?
    Pundit.policy!(user_context, record.parent).update?
  end
end