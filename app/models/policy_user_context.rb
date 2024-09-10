class PolicyUserContext
  attr_reader :user, :current_organization, :organization_user

  def initialize(user, current_organization)
    @user = user
    @current_organization = current_organization
    @organization_user = OrganizationUser.find_by(organization: current_organization, user: user)
  end
end