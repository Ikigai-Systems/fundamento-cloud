class OrganizationUserPolicy < ApplicationPolicy
  def create?
    # Currently we don't allow creating users manually in Cloud
    destroy? && !Flipper.enabled?(:cloud)
  end

  def change_password?
    create?
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