class ObjectCommentPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.where(space: Pundit.policy_scope!(user_context, ObjectComment))
    end
  end

  def show?
    Pundit.policy!(user_context, record.space).show?
  end

  def create?
    Pundit.policy!(user_context, record.space).show?
  end

  def update?
    record.organization_user = user_context.organization_user
  end

  def destroy?
    record.organization_user = user_context.organization_user
  end
end