# frozen_string_literal: true

class SidebarAttachmentsTab < ViewComponent::Base
  # Can't use helpers.turbo_frame_tag because of the following bug:
  # https://github.com/ViewComponent/view_component/issues/1099
  # but the following workaround seems to do the trick:
  include Turbo::FramesHelper

  def initialize(object:, pundit_user:)
    @object = object
    @pundit_user = pundit_user
  end

  def before_render
    @attachments = @object.attachments.order(:filename)
    @can_update = Pundit.policy(@pundit_user, @object).update?
  end
end
