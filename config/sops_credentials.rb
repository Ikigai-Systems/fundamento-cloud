# frozen_string_literal: true

# SOPS Credentials Loader
# This initializer loads and decrypts secrets from SOPS-encrypted YAML files
# and makes them available throughout the Rails application.

module SopsCredentials
  # Wrapper class that mimics Rails ActiveSupport::EncryptedConfiguration
  # This ensures compatibility with gems that expect Rails.application.credentials behavior
  class CredentialsWrapper
    def initialize(hash)
      @data = hash.is_a?(Hash) ? hash.with_indifferent_access : {}
    end

    # Delegate hash-like methods to the underlying data
    def [](key)
      @data[key]
    end

    def dig(*keys)
      @data.dig(*keys)
    end

    def fetch(key, *args)
      @data.fetch(key, *args)
    end

    def key?(key)
      @data.key?(key)
    end

    # Methods that gems like Devise expect
    def secret_key_base
      @data[:secret_key_base] || ENV["SECRET_KEY_BASE"]
    end

    def present?
      @data.present?
    end

    # Delegate any other method to the underlying hash
    def method_missing(method, *args, &block)
      if @data.respond_to?(method)
        @data.send(method, *args, &block)
      else
        super
      end
    end

    def respond_to_missing?(method, include_private = false)
      @data.respond_to?(method) || super
    end
  end
end

module SopsCredentials
  class << self
    attr_accessor :secrets

    def load!(root_path = nil, environment = nil)
      # Use provided paths or fall back to Rails if available
      root = root_path || (defined?(Rails) && Rails.respond_to?(:root) ? Rails.root.to_s : nil)
      root ||= File.expand_path("../../..", __FILE__)  # Go up from config/initializers/ to project root
      env = environment || ENV["RAILS_ENV"] || ENV["RACK_ENV"] || "development"

      secrets_file = File.join(root, "config/secrets/#{env}.sops.yaml")

      unless File.exist?(secrets_file)
        log_message("SOPS secrets file not found: #{secrets_file}", :warn)
        @secrets = {}
        return
      end

      # Decrypt SOPS file using the sops command
      decrypted_content = `sops -d #{secrets_file} 2>&1`

      if $?.success?
        @secrets = YAML.safe_load(decrypted_content, aliases: true) || {}
        @secrets = @secrets.with_indifferent_access
        log_message("Successfully loaded SOPS secrets for #{env} environment", :info)
      else
        log_message("Failed to decrypt SOPS secrets: #{decrypted_content}", :error)
        raise "SOPS decryption failed. Ensure age key is configured at ~/.config/sops/age/keys.txt"
      end
    rescue => e
      log_message("Error loading SOPS secrets: #{e.message}", :error)
      raise
    end

    # Access secrets with dot notation or hash syntax
    # Example: SopsCredentials.dig("rails", "master_key")
    def dig(*keys)
      @secrets&.dig(*keys)
    end

    # Get Rails master key from SOPS
    def rails_master_key
      dig("rails", "master_key")
    end

    # Get FontAwesome auth token
    def fontawesome_token
      dig("fontawesome", "auth_token")
    end

    # Get MinIO credentials
    def minio_access_key
      dig("minio", "access_key")
    end

    def minio_secret_key
      dig("minio", "secret_key")
    end

    # Get credentials nested under the credentials key
    # This maintains compatibility with Rails.application.credentials
    def credentials
      @credentials ||= CredentialsWrapper.new(dig("credentials") || {})
    end

    private

    def log_message(message, level = :info)
      if defined?(Rails) && Rails.respond_to?(:logger) && Rails.logger
        case level
        when :warn
          Rails.logger.warn(message)
        when :error
          Rails.logger.error(message)
        else
          Rails.logger.info(message)
        end
      else
        puts "[SOPS] #{message}"
      end
    end
  end
end

# Note: Secrets are loaded from config/application.rb with explicit root path
# This ensures they're available before environment files load
