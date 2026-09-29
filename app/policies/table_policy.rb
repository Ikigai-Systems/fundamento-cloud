class TablePolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    # `.kept` here as well as on the associations, because a policy scope is sometimes
    # handed the class rather than an association -- `policy_scope(Table)` would
    # otherwise see the trash.
    def resolve
      scope.kept.where(space: Pundit.policy_scope!(user_context, Space))
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