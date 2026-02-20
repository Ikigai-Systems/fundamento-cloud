class ImportSessionPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.where(organization: user_context.current_organization)
    end
  end

  def index?
    user_context.organization_membership.present?
  end

  def show?
    record.organization == user_context.current_organization
  end

  def create?
    user_context.organization_membership.present?
  end

  def update?
    owns_or_manages?
  end

  def destroy?
    owns_or_manages?
  end

  private

  def owns_or_manages?
    record.organization_membership == user_context.organization_membership ||
      user_context.organization_membership.manager?
  end
end
