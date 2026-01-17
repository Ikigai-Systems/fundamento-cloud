class TeamPolicy < OrganizationPolicy

  def create?
    organization_membership.manager?
  end
end