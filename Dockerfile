# syntax = docker/dockerfile:1

# Make sure RUBY_VERSION matches the Ruby version in .ruby-version and Gemfile
ARG RUBY_VERSION=3.3.2
FROM registry.docker.com/library/ruby:$RUBY_VERSION-slim AS base

RUN --mount=target=/var/lib/apt/lists,type=cache,sharing=locked \
    --mount=target=/var/cache/apt,type=cache,sharing=locked \
    rm -f /etc/apt/apt.conf.d/docker-clean && \
    apt-get update -qq && \
    apt-get install --no-install-recommends -y libpq-dev curl

# Rails app lives here
WORKDIR /rails

# Set production environment
ENV RAILS_ENV="production" \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/rails/vendor/bundle" \
    BUNDLE_WITHOUT="development"

# Ikigai-specific production environment
ENV RAILS_SERVE_STATIC_FILES="true"

# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build gems
RUN --mount=target=/var/lib/apt/lists,type=cache,sharing=locked \
    --mount=target=/var/cache/apt,type=cache,sharing=locked \
    curl -sL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install --no-install-recommends -y build-essential git libvips pkg-config nodejs && \
    npm install -g npm@latest

# Install application gems
COPY Gemfile Gemfile.lock ./

# Improving bundle install performance based on the followin article -
# https://release.com/blog/cache-bundle-install-with-buildkit
RUN --mount=type=cache,sharing=locked,target=/var/cache/bundle \
    BUNDLE_PATH=/var/cache/bundle bundle install && \
    mkdir -p "${BUNDLE_PATH}" && \
    cp -ar /var/cache/bundle/* "${BUNDLE_PATH}" && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git && \
    bundle exec bootsnap precompile --gemfile

COPY package.json package-lock.json ./
RUN --mount=type=cache,sharing=locked,target=/var/cache/npm \
    npm ci --cache /var/cache/npm

# Copy application code
COPY . .

# Precompile bootsnap code for faster boot times
RUN bundle exec bootsnap precompile app/ lib/

## Build frontend
RUN npm run build

# Ikigai-specific: precompile assets
RUN SECRET_KEY_BASE=`bin/rails secret` bin/rails assets:precompile && \
    rm -rf tmp/cache/assets

# Final stage for app image
FROM base

# Install packages needed for deployment
RUN --mount=target=/var/lib/apt/lists,type=cache,sharing=locked \
    --mount=target=/var/cache/apt,type=cache,sharing=locked \
    apt-get install --no-install-recommends -y libvips gettext

# Run and own only the runtime files as a non-root user for security
RUN useradd rails --create-home --shell /bin/bash

# Copy built artifacts: gems, application
COPY --from=build /rails/config.ru /rails/Rakefile ./
COPY --from=build /rails/public ./public
COPY --from=build /rails/lib ./lib
COPY --from=build /rails/bin ./bin
COPY --from=build /rails/db ./db
COPY --from=build /rails/config ./config
COPY --from=build /rails/Gemfile* ./
COPY --from=build /rails/app ./app
COPY --from=build /rails/vendor ./vendor

COPY --from=build --chown=rails:rails /rails/log /rails/log
COPY --from=build --chown=rails:rails /rails/storage /rails/storage
COPY --from=build --chown=rails:rails /rails/tmp /rails/tmp

# Run and own only the runtime files as a non-root user for security
RUN chown -R rails:rails public/assets/projectEnvVariables*.js

USER rails:rails

# Entrypoint prepares the database.
# ...and passes environment variables to the frontend
ENTRYPOINT ["/rails/bin/docker-entrypoint"]

# Start the server by default, this can be overwritten at runtime

# rails:
EXPOSE 3000

CMD ["./bin/rails", "server"]
