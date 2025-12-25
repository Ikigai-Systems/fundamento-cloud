require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

# Load SOPS secrets before application configuration
# This needs to happen before environment files load
require_relative "sops_credentials"

# Load secrets now with explicit root path
SopsCredentials.load!(File.expand_path("..", __dir__))

module Fundamento
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.1

    # Make SOPS credentials available via Rails.application.sops (parallel to Rails.application.credentials)
    def sops
      SopsCredentials
    end

    # Override credentials to return SOPS credentials for backward compatibility with gems
    # This allows gems that call Rails.application.credentials to transparently use SOPS
    def credentials
      SopsCredentials.credentials
    end

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w(assets tasks))

    # From https://guides.rubyonrails.org/active_job_basics.html#serializers
    config.autoload_once_paths << "#{Rails.root}/app/serializers"

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    config.action_mailer.default_url_options = { :host => ENV.fetch("HTTP_HOST", "localhost:3000") }

    # Enable lograge, but make it the default only on production
    config.lograge.enabled = true
    config.lograge.formatter = Lograge::Formatters::Logstash.new

    if !Rails.env.production? && !Rails.env.standalone?
      config.lograge.keep_original_rails_log = true
      config.lograge.logger = ActiveSupport::Logger.new "#{Rails.root}/log/#{Rails.env}-lograge.log"
    end

    # Only loads a smaller set of middleware suitable for API only apps.
    # Middleware like session, flash, cookies can be added back manually.
    # Skip views, helpers and assets when generating a new resource.
    config.api_only = false
  end
end
