# frozen_string_literal: true

# Items for the multiselect that picks space managers and team members. The
# avatar travels as server-rendered HTML so the picker draws users exactly as
# UserAvatar does everywhere else in the Rails UI.
module MemberPickerItems
  extend ActiveSupport::Concern

  AVATAR_INCLUDES = { avatar_attachment: { blob: { variant_records: { image_attachment: :blob } } } }.freeze

  private

  def member_picker_item(member)
    {
      value: "#{member.class}|#{member.id}",
      text: member.try(:display_name) || member.try(:name),
      avatar: view_context.render(MemberAvatar.new(member: member)),
    }
  end

  def organization_memberships_for_picker(query)
    current_organization.organization_memberships.query(query).includes(user: AVATAR_INCLUDES)
  end
end
