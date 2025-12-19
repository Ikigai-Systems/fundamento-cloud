module FlipperHelpersAround
  # Enable or disable a feature flag for the duration of the test
  # Works with memory adapter in tests - no database persistence issues
  def with_feature(feature_name, enabled: true)
    currently = Flipper.enabled?(feature_name)

    if enabled
      Flipper.enable(feature_name)
    else
      Flipper.disable(feature_name)
    end

    yield
  ensure
    if currently
      Flipper.enable(feature_name)
    else
      Flipper.disable(feature_name)
    end
  end
end

module FlipperHelpers
  # Test both enabled and disabled states of a feature
  def with_feature_both_states(feature_name, &block)
    context "when #{feature_name} is enabled" do
      around do |example|
        with_feature(feature_name, enabled: true) { example.run }
      end

      instance_eval(&block)
    end

    context "when #{feature_name} is disabled" do
      around do |example|
        with_feature(feature_name, enabled: false) { example.run }
      end

      instance_eval(&block)
    end
  end
end

RSpec.configure do |config|
  config.include FlipperHelpersAround
  config.extend FlipperHelpers
end
