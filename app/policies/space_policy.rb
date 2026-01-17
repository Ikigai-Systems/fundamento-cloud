class SpacePolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      if organization_membership.manager?
        # Managers can see all spaces
        scope.all
      else
        # Everyone can see public and restricted spaces
        spaces_available_to_anyone = scope.where(access_mode: [:public, :restricted]).select(:id)

        # Members can see private spaces they are members of
        spaces_available_to_user = scope.where(access_mode: :private).
          joins(:space_memberships).
          where(space_memberships: {
            member_type: organization_membership.class.to_s,
            member_id: organization_membership.id,
          }).select(:id)

        # Members can see private spaces that their teams are members of
        spaces_available_to_team = scope.where(access_mode: :private).
          joins(:space_memberships).
          where(space_memberships: {
            member_type: Team.to_s,
          }).joins("INNER JOIN team_memberships ON team_memberships.team_id = space_memberships.member_id").
          where(team_memberships: {
            member_type: organization_membership.class.to_s,
            member_id: organization_membership.id,
          }).select(:id)

        scope.where(id: scope.where(id: spaces_available_to_anyone).
          or(scope.where(id: spaces_available_to_user)).
          or(scope.where(id: spaces_available_to_team)).select(:id).distinct)
      end
    end
  end

  def index?
    true
  end

  def create?
    organization_membership.manager?
  end

  def show?
    # Everyone can show an organization it belongs to
    record.public_access_mode? || record.restricted_access_mode? || update?
  end

  def update?
    record.public_access_mode? ||
    organization_membership.manager? ||
      record.space_memberships.where(member: organization_membership).exists? ||
      record.space_memberships.where(space_memberships: {
        member_type: Team.to_s,
      }).joins("INNER JOIN team_memberships ON team_memberships.team_id = space_memberships.member_id").
        where(team_memberships: {
          member_type: organization_membership.class.to_s,
          member_id: organization_membership.id,
        }).exists?
  end

  def destroy?
    update?
  end
end