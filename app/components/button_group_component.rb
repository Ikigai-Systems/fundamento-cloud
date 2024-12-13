# frozen_string_literal: true

class ButtonGroupComponent < ViewComponent::Base
  renders_one :primary_buttons
  renders_one :dropdown_menu
end
