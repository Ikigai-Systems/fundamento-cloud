# syntax = docker/dockerfile:1

# Make sure RUBY_VERSION matches the Ruby version in .ruby-version and Gemfile
ARG RUBY_VERSION=3.3.2

FROM registry.docker.com/library/ruby:$RUBY_VERSION-slim AS base

ARG RAILS_ENV="production"

RUN --mount=target=/var/lib/apt/lists,type=cache,sharing=locked \
    --mount=target=/var/cache/apt,type=cache,sharing=locked \
    rm -f /etc/apt/apt.conf.d/docker-clean && \
    apt-get update -qq && \
    apt-get install --no-install-recommends -y libpq-dev curl

# Rails app lives here
WORKDIR /rails

# Set production environment
ENV RAILS_ENV=${RAILS_ENV} \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/rails/vendor/bundle" \
    BUNDLE_WITHOUT="development"

# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build gems
RUN --mount=target=/var/lib/apt/lists,type=cache,sharing=locked \
    --mount=target=/var/cache/apt,type=cache,sharing=locked \
    curl -sL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install --no-install-recommends -y build-essential git libvips pkg-config nodejs && \
    npm install -g npm@latest

# Install application gems
COPY Gemfile Gemfile.lock ./

# Improving bundle install performance based on the followin article -
# https://release.com/blog/cache-bundle-install-with-buildkit
RUN --mount=type=secret,id=fontawesome-auth,env=BUNDLE_DL__FONTAWESOME__COM \
    --mount=type=cache,sharing=locked,target=/var/cache/bundle \
    BUNDLE_PATH=/var/cache/bundle bundle install && \
    mkdir -p "${BUNDLE_PATH}" && \
    cp -ar /var/cache/bundle/* "${BUNDLE_PATH}" && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git && \
    bundle exec bootsnap precompile --gemfile

COPY package.json package-lock.json ./
RUN --mount=type=cache,sharing=locked,target=/var/cache/npm \
    npm ci --cache /var/cache/npm

COPY micro-services/blocknote/package.json micro-services/blocknote/package-lock.json ./micro-services/blocknote/
RUN --mount=type=cache,sharing=locked,target=/var/cache/npm \
    cd micro-services/blocknote && npm ci --cache /var/cache/npm

# Copy application code
COPY . .

# Precompile bootsnap code for faster boot times
RUN bundle exec bootsnap precompile app/ lib/

# Ikigai-specific: precompile assets
RUN SECRET_KEY_BASE=`bin/rails secret` DATABASE_URL="postgres://postgres:password@localhost/postgres" bin/rails assets:precompile && \
    rm -rf tmp/cache/assets

# Transpile blocknote server side utils for document-to-blocks conversion
RUN cd micro-services/blocknote && npm run build

# Final stage for app image
FROM base AS packaged

# Install packages needed for deployment
RUN --mount=target=/var/lib/apt/lists,type=cache,sharing=locked \
    --mount=target=/var/cache/apt,type=cache,sharing=locked \
    curl -sL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install --no-install-recommends -y libvips gettext nodejs

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
COPY --from=build /rails/micro-services/blocknote/build ./micro-services/blocknote/build
COPY --from=build /rails/micro-services/blocknote/node_modules ./micro-services/blocknote/node_modules

# Use COPY --chown instead of chown as the latter is very slow (took 100s on my machine)
# see https://github.com/docker/for-linux/issues/388
COPY --from=build --chown=rails:rails /rails/log /rails/log
COPY --from=build --chown=rails:rails /rails/storage /rails/storage
COPY --from=build --chown=rails:rails /rails/tmp /rails/tmp

# Make this directory writable in the standalone version so users can create their own credentials,
# and make sure there's editor available
RUN --mount=target=/var/lib/apt/lists,type=cache,sharing=locked \
    --mount=target=/var/cache/apt,type=cache,sharing=locked \
    if [ "$RAILS_ENV" = "standalone" ]; then \
      rm -f ./config/credentials/*.yml.enc && \
      chown rails:rails ./config/credentials && \
      apt-get update -qq && \
      apt-get install --no-install-recommends -y nano; \
    fi

USER rails:rails

# Entrypoint prepares the database.
# ...and passes environment variables to the frontend
ENTRYPOINT ["/rails/bin/docker-entrypoint"]

# Start the server by default, this can be overwritten at runtime

# rails:
EXPOSE 3000

CMD ["./bin/rails", "server"]

FROM packaged AS test

ENV DATABASE_CLEANER_ALLOW_REMOTE_DATABASE_URL=true
ENV VITE_RUBY_AUTO_BUILD=false

COPY --from=build /rails/spec/e2e ./spec/e2e

RUN echo "RAILS_ENV is $RAILS_ENV"

# Publish production as the default layer
FROM packaged AS production

