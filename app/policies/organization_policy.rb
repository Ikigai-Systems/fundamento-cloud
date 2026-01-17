class OrganizationPolicy < ApplicationPolicy
  def create?
    true
  end

  def show?
    # Everyone can show an organization it belongs to, and we make sure access is enforced
    # in EnsureOrganization and OrganizationController
    true
  end

  def index?
    show?
  end

  def update?
    organization_membership.manager?
  end

  def destroy?
    update?
  end

  def select?
    show?
  end

  def invite_user?
    update?
  end
end