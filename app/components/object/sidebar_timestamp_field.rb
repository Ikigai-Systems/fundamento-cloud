# frozen_string_literal: true

class SidebarTimestampField < ViewComponent::Base
  def initialize(label:, datetime:)
    @label = label
    @datetime = datetime
  end
end
