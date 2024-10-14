if Rails.env.development?
  # Example: Generate TypeScript files.
  JsFromRoutes.config do |config|
    config.client_library = '@js-from-routes/axios'
  end
end