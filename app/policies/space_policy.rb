class SpacePolicy < OrganizationPolicy
  def create?
    # Everyone can create new spaces
    true
  end
end