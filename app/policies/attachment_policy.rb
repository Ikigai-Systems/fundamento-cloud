class AttachmentPolicy < ApplicationPolicy
  def show?
    Pundit.authorize user_context, record.parent, :show?
  end

  def create?
    Pundit.authorize user_context, record.parent, :update?
  end

  def update?
    Pundit.authorize user_context, record.parent, :update?
  end

  def destroy?
    Pundit.authorize user_context, record.parent, :update?
  end
end