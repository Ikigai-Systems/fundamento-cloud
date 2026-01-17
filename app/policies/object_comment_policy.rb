class ObjectCommentPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.where(space: Pundit.policy_scope!(user_context, ObjectComment))
    end
  end

  def show?
    Pundit.policy!(user_context, record.object).show?
  end

  def create?
    Pundit.policy!(user_context, record.object).show?
  end

  def update?
    record.organization_membership = user_context.organization_membership
  end

  def destroy?
    record.organization_membership = user_context.organization_membership
  end
end