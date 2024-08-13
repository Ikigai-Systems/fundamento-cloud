sentry_dsn = ENV.fetch("SENTRY_DSN", Rails.application.credentials[:sentry_dsn])

if sentry_dsn.present?
  Sentry.init do |config|
    config.dsn = sentry_dsn

    # Set traces_sample_rate to 1.0 to capture 100%
    # of transactions for performance monitoring.
    # We recommend adjusting this value in production.
    config.traces_sample_rate = 1.0
    # or
    # config.traces_sampler = lambda do |context|
    #   true
    # end

    # Set profiles_sample_rate to profile 100%
    # of sampled transactions.
    # We recommend adjusting this value in production.
    config.profiles_sample_rate = 1.0
  end
end
