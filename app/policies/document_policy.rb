class DocumentPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.where(space: Pundit.policy_scope!(user_context, Space))
    end
  end
end