class OrganizationPolicy < ApplicationPolicy
  def show?
    # Everyone can show an organization it belongs to
    true
  end

  def index?
    show?
  end

  def update?
    organization_user.manager?
  end

  def edit?
    update?
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