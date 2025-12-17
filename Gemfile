source "https://rubygems.org"

ruby "3.4.7"

# Bundle edge Rails instead: gem "rails", github: "rails/rails", branch: "main"
gem "rails", "~> 8.1.1"

# The original asset pipeline for Rails [https://github.com/rails/sprockets-rails]
gem "sprockets-rails"

# Use the Puma web server [https://github.com/puma/puma]
gem "puma", ">= 5.0"

# Use JavaScript with ESM import maps [https://github.com/rails/importmap-rails]
gem "importmap-rails"

# Hotwire's SPA-like page accelerator [https://turbo.hotwired.dev]
gem "turbo-rails"

# Hotwire's modest JavaScript framework [https://stimulus.hotwired.dev]
gem "stimulus-rails"

# Build JSON APIs with ease [https://github.com/rails/jbuilder]
# gem "jbuilder"

# Use Redis adapter to run Action Cable in production
gem "redis", ">= 4.0.1"

# Use Kredis to get higher-level data types in Redis [https://github.com/rails/kredis]
# gem "kredis"

# Use Active Model has_secure_password [https://guides.rubyonrails.org/active_model_basics.html#securepassword]
# gem "bcrypt", "~> 3.1.7"

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem "tzinfo-data", platforms: %i[ windows jruby ]

# Reduces boot times through caching; required in config/boot.rb
gem "bootsnap", require: false

# Use Active Storage variants [https://guides.rubyonrails.org/active_storage_overview.html#transforming-images]
gem "image_processing", "~> 1.2"

# Use Rack CORS for handling Cross-Origin Resource Sharing (CORS), making cross-origin Ajax possible
gem "rack-cors", "~> 2.0"

gem "pg"

gem "rails-static-router"

# Ruby 3.4+ extracted standard libraries (must be explicitly included)
gem "csv"
gem "ostruct"

#gem "y-rb", git: "https://github.com/stefan-iki/yrb", branch: "add-support-for-xmltext-diff"
gem "y-rb"
gem "y-rb_actioncable"

gem "devise", github: "heartcombo/devise", branch: "main"
gem "devise_invitable"
gem "devise-passwordless"

gem "tailwindcss-rails", "~> 3.0"
# pin to tailwindcss version:
gem "tailwindcss-ruby", "3.4.17"
gem "vite_rails"
gem "view_component"

gem "stackprof"
gem "sentry-ruby"
gem "sentry-rails"
gem "solid_assert"

gem "hash_diff"
gem "nanoid"
gem "pundit"
gem "sequenced"
gem "activerecord-like"

gem "lograge", "~> 0.14.0"
gem "logstash-event", "~> 1.2"

gem "aws-sdk-s3", require: false

# Document processing
gem "docx"

gem "wannabe_bool"

gem "good_job", "~> 4.4"

gem "net-http2"
gem "jwt"

gem "flipper-active_record"
gem "flipper-ui"
gem "recaptcha"

gem "random-word"

gem "initials"

gem "mcp"
gem "blueprinter", "~> 1.1"
gem "parslet", "~> 2.0"

# Pawel's font-awesome token
source "https://dl.fontawesome.com/basic/fontawesome-pro/ruby/" do
  gem "font-awesome-pro-sass"
end

group :development do
  # Speed up commands on slow machines / big apps [https://github.com/rails/spring]
  # gem "spring"
  gem "letter_opener"
end

group :development, :test do
  # See https://guides.rubyonrails.org/debugging_rails_applications.html#debugging-with-the-debug-gem
  gem "debug", platforms: %i[ mri windows ]

  gem "js_from_routes"

  gem "rspec", "~> 3.13"
  gem "rspec-rails"
  gem "rails-controller-testing"
  gem "database_cleaner-active_record"
  gem 'cypress-on-rails'
end

group :development, :test, :standalone do
  gem "dotenv-rails", "~> 3.1"
end
