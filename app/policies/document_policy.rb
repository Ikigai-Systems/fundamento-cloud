class DocumentPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    # `.kept` here rather than at each call site: the dashboard, mentions, search, the
    # API index and the MCP tools are all built from a policy scope, and every one of
    # them wants a trashed record to be invisible rather than merely unopenable.
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