# frozen_string_literal: true

# A space or team member as the pickers show it: a user's avatar, or a glyph
# for a team. Accepts what a membership's `member` can be.
class MemberAvatar < ViewComponent::Base
  def initialize(member:)
    @member = member
  end

  def user
    @member.is_a?(OrganizationMembership) ? @member.user : @member
  end

  def team?
    @member.is_a?(Team)
  end
end
