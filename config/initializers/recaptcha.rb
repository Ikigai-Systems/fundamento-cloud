if Rails.application.sops.credentials.dig(:recaptcha)
  Recaptcha.configure do |config|
    config.site_key  = Rails.application.sops.credentials.dig(:recaptcha, :site_key)
    config.secret_key = Rails.application.sops.credentials.dig(:recaptcha, :secret_key)
  end
end
