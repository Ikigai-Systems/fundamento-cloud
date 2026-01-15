# Flipper Feature Flag Test Helpers
#
# These helpers provide a clean, RubyMine-compatible way to test feature flags.
#
# ## Usage Examples
#
# ### Test feature in enabled state:
#   when_feature_enabled(:my_flag) do
#     it "works" do
#       expect(Flipper.enabled?(:my_flag)).to be true
#     end
#   end
#
# ### Test feature in disabled state:
#   when_feature_disabled(:my_flag) do
#     it "is disabled" do
#       expect(Flipper.enabled?(:my_flag)).to be false
#     end
#   end
#
# ### Test both states:
#   when_feature_both_states(:my_flag) do
#     it "handles flag state" do
#       # Runs twice: once enabled, once disabled
#       result = my_feature_method
#       expect(result).to be_present
#     end
#   end
#
# ### One-off flag changes in test:
#   it "toggles feature" do
#     with_feature_flag(:my_flag, enabled: true)
#     expect(Flipper.enabled?(:my_flag)).to be true
#   end

module FlipperHelpers
  # Set up feature flag state for a test using before/after hooks
  def setup_feature_flag(feature_name, enabled:)
    before do
      if enabled
        Flipper.enable(feature_name)
      else
        Flipper.disable(feature_name)
      end
    end

    after do
      Flipper.disable(feature_name)
    end
  end

  # Test feature in enabled state - creates a standard RSpec context
  def when_feature_enabled(feature_name, &block)
    context "when #{feature_name} is enabled" do
      setup_feature_flag(feature_name, enabled: true)
      class_eval(&block)
    end
  end

  # Test feature in disabled state - creates a standard RSpec context
  def when_feature_disabled(feature_name, &block)
    context "when #{feature_name} is disabled" do
      setup_feature_flag(feature_name, enabled: false)
      class_eval(&block)
    end
  end

  # Test feature in both states - creates two standard RSpec contexts
  def when_feature_both_states(feature_name, &block)
    when_feature_enabled(feature_name, &block)
    when_feature_disabled(feature_name, &block)
  end
end

# Instance-level helper for one-off flag changes in before blocks
module FlipperInstanceHelpers
  def with_feature_flag(feature_name, enabled:)
    if enabled
      Flipper.enable(feature_name)
    else
      Flipper.disable(feature_name)
    end
  end
end

RSpec.configure do |config|
  config.extend FlipperHelpers
  config.include FlipperInstanceHelpers

  # Ensure Flipper is reset between tests
  config.before(:each) do
    Flipper.features.each(&:remove)
  end
end
