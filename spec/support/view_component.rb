# frozen_string_literal: true

require "view_component/test_helpers"

RSpec.configure do |config|
  config.include ViewComponent::TestHelpers, type: :component

  # ViewComponent::TestHelpers provides the `page` method for accessing rendered content
  # We also need to include Capybara's query methods which ViewComponent uses internally
  config.include ViewComponent::TestHelpers::Matchers, type: :component if defined?(ViewComponent::TestHelpers::Matchers)
end
