class OrganizationUserPolicy < ApplicationPolicy
  def destroy?
    # Only managers can remove users from the organization
    OrganizationUser.find([record.organization, user])&.manager?
  end

  def demote?
    destroy?
  end

  def promote?
    demote?
  end
end