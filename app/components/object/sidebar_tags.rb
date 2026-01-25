class SidebarTags < ViewComponent::Base
  # Can't use helpers.turbo_frame_tag because of the following bug:
  # https://github.com/ViewComponent/view_component/issues/1099
  # but the following workaround seems to do the trick:
  include Turbo::FramesHelper

  def initialize(object:)
    @object = object
  end

  def object_tags_as_multiselect_value
    @object.tags.map do |tag|
      {
        value: tag.hashtag,
        text: tag.hashtag,
      }
    end.to_json
  end
end