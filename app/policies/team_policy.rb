class TeamPolicy < OrganizationPolicy

  def create?
    organization_user.manager?
  end
end