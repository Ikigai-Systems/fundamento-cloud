class DocumentPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.where(space: Pundit.policy_scope!(user_context, Space))
    end
  end

  def show?
    Pundit.policy!(user_context, record.space).show?
  end

  def create?
    Pundit.policy!(user_context, record.space).update?
  end

  def update?
    Pundit.policy!(user_context, record.space).update?
  end

  def destroy?
    Pundit.policy!(user_context, record.space).update?
  end
end