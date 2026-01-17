class PolicyUserContext
  attr_reader :user, :current_organization, :organization_membership

  # Legacy alias for backward compatibility during migration
  alias_method :organization_membership, :organization_membership

  def initialize(user_or_organization_membership, current_organization = nil)
    if user_or_organization_membership.is_a?(OrganizationMembership)
      @user = user_or_organization_membership.user
      @current_organization = user_or_organization_membership.organization
      @organization_membership = user_or_organization_membership
    else
      @user = user_or_organization_membership
      @current_organization = current_organization
      @organization_membership = OrganizationMembership.find_by(organization: current_organization, user: user_or_organization_membership)
    end
  end
end