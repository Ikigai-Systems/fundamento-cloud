# frozen_string_literal: true

class SidebarConnectionsTab < ViewComponent::Base
  # Can't use helpers.turbo_frame_tag because of the following bug:
  # https://github.com/ViewComponent/view_component/issues/1099
  # but the following workaround seems to do the trick:
  include Turbo::FramesHelper

  def initialize(object:, pundit_user:)
    @object = object
    @references = ReferencesExtractor::all_references(Pundit.policy_scope(pundit_user, pundit_user.current_organization.documents))
    @incoming = @references.select do |reference|
      reference.object_type == object.class.to_s && reference.object_npi == object.npi
    end
  end
end
