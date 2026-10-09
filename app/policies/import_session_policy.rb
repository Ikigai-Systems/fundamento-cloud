class ImportSessionPolicy < ApplicationPolicy
  # An import lists the paths, sizes and checksums of every file it uploaded, so it is visible
  # only to the member who started it and to managers, who can see every space anyway. Any
  # member used to see every import in the organization, including imports into private spaces
  # they could not open.
  class Scope < ApplicationPolicy::Scope
    def resolve
      sessions = scope.where(organization: user_context.current_organization)
      return sessions if user_context.organization_membership.manager?

      sessions.where(organization_membership: user_context.organization_membership)
    end
  end

  def index?
    user_context.organization_membership.present?
  end

  def show?
    record.organization == user_context.current_organization && owns_or_manages?
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
