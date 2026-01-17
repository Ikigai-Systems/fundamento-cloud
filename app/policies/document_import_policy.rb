class DocumentImportPolicy < ApplicationPolicy
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
    record.organization_membership == user_context.organization_membership ||
      user_context.organization_membership.manager?
  end

  def destroy?
    record.organization_membership == user_context.organization_membership ||
      user_context.organization_membership.manager?
  end
end