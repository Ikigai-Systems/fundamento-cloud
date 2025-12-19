require_relative "../../lib/flipper/adapters/static_feature"

# Configure Flipper adapter based on environment
if Rails.env.test?
  # Disable memoization to avoid per-request caching in tests
  Flipper.configure do |config|
    config.default do
      Flipper.new(@builder.to_adapter, memoize: false)
    end
  end
else
  # Build adapter chain using AdapterBuilder pattern
  # Each config.use wraps the previous adapter in a decorator
  Flipper.configure do |config|
    # Base adapter: ActiveRecord with database persistence
    config.adapter { Flipper::Adapters::ActiveRecord.new }

    # Layer 1: Failover to memory if the database unavailable
    config.use Flipper::Adapters::Failover, Flipper::Adapters::Memory.new, dual_write: true

    # Layer 2 (production only): Static value for standalone
    # This optimization avoids database lookups for environment-based flags
    if Rails.env.production? || Rails.env.standalone?
      config.use Flipper::Adapters::StaticFeature,:standalone, Rails.env.standalone?  # enabled in cloud mode, disabled in standalone
    end
  end
end