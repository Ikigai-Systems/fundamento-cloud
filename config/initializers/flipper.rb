require_relative "../../lib/flipper/adapters/static_feature"
require "flipper/adapters/failover"

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
    config.use Flipper::Adapters::StaticFeature, :standalone, Rails.env.standalone? # enabled in cloud mode, disabled in standalone
  end
end
