class OrganizationUserPolicy < ApplicationPolicy
  def create?
    destroy?
  end

  def destroy?
    # Only managers can remove users from the organization
    OrganizationUser.find_by({ organization: record.organization, user: user })&.manager?
  end

  def demote?
    destroy? && record.manager?
  end

  def promote?
    destroy? && record.member?
  end
end