sentry_dsn = ENV.fetch("SENTRY_DSN", Rails.application.credentials[:sentry_dsn])

if sentry_dsn.present?
  Sentry.init do |config|
    config.dsn = sentry_dsn

    # get breadcrumbs from logs
    config.breadcrumbs_logger = [:active_support_logger, :http_logger]

    # from https://docs.sentry.io/platforms/ruby/guides/rails/configuration/options/
    config.backtrace_cleanup_callback = lambda do |backtrace|
      Rails.backtrace_cleaner.clean(backtrace)
    end

    # this example uses Rails' parameter filter to sanitize the event payload
    # for Rails 6+
    config.before_send = lambda do |event, _hint|
      filter = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
      filter.filter(event.to_hash)
    end

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
