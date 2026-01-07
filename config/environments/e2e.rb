# E2E Test Environment
# This environment mirrors production as closely as possible while allowing for test-specific needs

require_relative "production"

# Inherit most settings from production, then override specific settings below for E2E testing environment
Rails.application.configure do
  # Error handling: Show detailed errors for debugging
  config.consider_all_requests_local = true

  # Action Mailer: Test delivery but log emails
  config.action_mailer.delivery_method = :test
  config.action_mailer.perform_caching = false

  # Active Storage: Use local storage for tests
  config.active_storage.service = :local

  # Disable request forgery protection in test environment
  # Cypress handles CSRF differently
  config.action_controller.allow_forgery_protection = false

  # I18n: Raise errors for missing translations
  config.i18n.raise_on_missing_translations = true

  # Reset allowed hosts
  config.hosts = nil

  # Action Cable: Use Redis like production
  config.action_cable.url = "ws://#{ENV.fetch("HTTP_HOST", "localhost:3000")}/cable"
  config.action_cable.allowed_request_origins = [
    /http:\/\/localhost:*/
  ]
end
