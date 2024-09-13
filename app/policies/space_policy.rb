class SpacePolicy < OrganizationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      if organization_user.manager?
        # Managers can see all spaces
        scope.all
      else
        # Everyone can see public and restricted spaces
        spaces_available_to_anyone = scope.where(access_mode: [:public, :restricted]).select(:id)

        # Members can see private spaces they are members of
        spaces_available_to_user = scope.where(access_mode: :private).
          joins(:space_memberships).
          where(space_memberships: {
            member_type: organization_user.class.to_s,
            member_id: organization_user.id,
          }).select(:id)

        # Members can see private spaces that their teams are members of
        spaces_available_to_team = scope.where(access_mode: :private).
          joins(:space_memberships).
          where(space_memberships: {
            member_type: Team.to_s,
          }).joins("INNER JOIN team_memberships ON team_memberships.team_id = space_memberships.member_id").
          where(team_memberships: {
            member_type: organization_user.class.to_s,
            member_id: organization_user.id,
          }).select(:id)

        puts scope.where(id: spaces_available_to_anyone).
          or(scope.where(id: spaces_available_to_user)).
          or(scope.where(id: spaces_available_to_team)).distinct.to_sql

        scope.where(id: scope.where(id: spaces_available_to_anyone).
          or(scope.where(id: spaces_available_to_user)).
          or(scope.where(id: spaces_available_to_team)).select(:id).distinct)
      end
    end
  end

  def create?
    # Everyone can create new spaces
    true
  end
end