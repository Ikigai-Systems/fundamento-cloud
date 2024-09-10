class PolicyUserContext
  attr_reader :user, :current_organization

  def initialize(user, current_organization)
    @user = user
    @current_organization = current_organization
  end
end