class PolicyUserContext
  attr_reader :user, :current_organization, :organization_user

  def initialize(user_or_organization_user, current_organization = nil)
    if user_or_organization_user.is_a?(OrganizationUser)
      @user = user_or_organization_user.user
      @current_organization = user_or_organization_user.organization
      @organization_user = user_or_organization_user
    else
      @user = user_or_organization_user
      @current_organization = current_organization
      @organization_user = OrganizationUser.find_by(organization: current_organization, user: user_or_organization_user)
    end
  end
end