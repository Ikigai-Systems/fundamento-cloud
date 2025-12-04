class PolicyUserContextSerializer < ActiveJob::Serializers::ObjectSerializer
  def serialize(policy_user_context)
    super(
      if policy_user_context.organization_user
        { 'organization_user_id' => policy_user_context.organization_user.id }
      else
        { 
          'user_id' => policy_user_context.user.id, 
          'organization_id' => policy_user_context.current_organization.id 
        }
      end
    )
  end

  def deserialize(hash)
    if hash['organization_user_id']
      organization_user = OrganizationUser.find(hash['organization_user_id'])
      PolicyUserContext.new(organization_user)
    else
      user = User.find(hash['user_id'])
      organization = Organization.find(hash['organization_id'])
      PolicyUserContext.new(user, organization)
    end
  end

  def klass
    PolicyUserContext
  end
end