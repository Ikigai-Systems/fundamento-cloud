# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

# Rails.application.config.middleware.insert_before 0, Rack::Cors do
#   allow do
#     origins "example.com"
#
#     resource "*",
#       headers: :any,
#       methods: [:get, :post, :put, :patch, :delete, :options, :head]
#   end
# end

# TODO: Add production URLs to the list
# Use '*' if you want expose the API to the world
accept = [
  'http://127.0.0.1:5173', # Dev Frontend
  'http://localhost:5173', # Dev Frontend
  'http://127.0.0.1:5174', # Dev Frontend
  'http://localhost:5174', # Dev Frontend
]

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins accept
    resource '*',
      headers: :any,
      methods: %i[get post put delete options patch],
      expose: %w[Authorization]
  end
end
