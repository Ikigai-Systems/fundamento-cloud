class DocumentPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.where(space: Pundit.policy_scope!(user_context, Space))
    end
  end

  def show?
    Pundit.authorize user_context, record.space, :show?
  end

  def create?
    Pundit.authorize user_context, record.space, :update?
  end

  def update?
    Pundit.authorize user_context, record.space, :update?
  end

  def destroy?
    Pundit.authorize user_context, record.space, :update?
  end
end