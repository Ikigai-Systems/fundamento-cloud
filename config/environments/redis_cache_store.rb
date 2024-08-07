# frozen_string_literal: true

Rails.application.configure do
  config.cache_store = :redis_cache_store, {
    url: ENV["REDIS_URL"],
    ssl_params: { verify_mode: OpenSSL::SSL::VERIFY_NONE },
    namespace: "npn:#{Rails.env}:cache",
  }
end