# syntax = docker/dockerfile:1

# Make sure RUBY_VERSION matches the Ruby version in .ruby-version and Gemfile
ARG RUBY_VERSION=3.4.7
ARG SOPS_VERSION=3.11.0
ARG NODE_MAJOR=24

# Node.js source stage for copying binaries
FROM registry.docker.com/library/node:${NODE_MAJOR}-slim AS node-source

FROM registry.docker.com/library/ruby:$RUBY_VERSION-slim AS base

ARG RAILS_ENV="production"

RUN --mount=target=/var/lib/apt/lists,type=cache,sharing=locked \
    --mount=target=/var/cache/apt,type=cache,sharing=locked \
    rm -f /etc/apt/apt.conf.d/docker-clean && \
    apt-get update -qq && \
    apt-get install --no-install-recommends -y libpq-dev curl pandoc

# Rails app lives here
WORKDIR /rails

# Set environment variables
ENV RAILS_ENV=${RAILS_ENV} \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/rails/vendor/bundle" \
    BUNDLE_WITHOUT="development"

# Throw-away build stage to reduce size of final image
FROM base AS build

# Re-declare build args for this stage
ARG SOPS_VERSION=3.11.0
ARG NODE_MAJOR=24
ARG TARGETARCH

# Copy Node.js from node-source stage
COPY --from=node-source /usr/local/bin/node /usr/local/bin/node
COPY --from=node-source /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/bin/node /usr/local/bin/nodejs && \
    ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm && \
    ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

# Install packages needed to build gems (including age and sops for secrets management during asset precompilation)
# Ruby 3.4+ requires libyaml-dev for psych gem native extension
RUN --mount=target=/var/lib/apt/lists,type=cache,sharing=locked \
    --mount=target=/var/cache/apt,type=cache,sharing=locked \
    apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git libvips pkg-config age libyaml-dev && \
    npm install -g npm@latest && \
    curl -LO https://github.com/getsops/sops/releases/download/v${SOPS_VERSION}/sops_${SOPS_VERSION}_${TARGETARCH}.deb && \
    dpkg -i sops_${SOPS_VERSION}_${TARGETARCH}.deb && \
    rm sops_${SOPS_VERSION}_${TARGETARCH}.deb

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

COPY micro-services/blocknote-converter/package.json micro-services/blocknote-converter/package-lock.json ./micro-services/blocknote-converter/
RUN --mount=type=cache,sharing=locked,target=/var/cache/npm \
    cd micro-services/blocknote-converter && npm ci --cache /var/cache/npm

# Copy application code
COPY . .

# Precompile bootsnap code for faster boot times
RUN bundle exec bootsnap precompile app/ lib/

# Ikigai-specific: precompile assets
# Mount SOPS age key as secret and set it as environment variable for SOPS to use
RUN --mount=type=secret,id=sops-age-key,env=SOPS_AGE_KEY \
    SECRET_KEY_BASE_DUMMY=1 DATABASE_URL="postgres://postgres:password@localhost/postgres" bin/rails assets:precompile && \
    rm -rf tmp/cache/assets

# Transpile blocknote-converter server side utils for document-to-blocks conversion
RUN cd micro-services/blocknote-converter && npm run build

# Final stage for app image
FROM base AS packaged

# Re-declare build args for this stage
ARG SOPS_VERSION=3.11.0
ARG NODE_MAJOR=24
ARG TARGETARCH

# Copy Node.js from node-source stage
COPY --from=node-source /usr/local/bin/node /usr/local/bin/node
COPY --from=node-source /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/bin/node /usr/local/bin/nodejs && \
    ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm && \
    ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

# Install packages needed for deployment (including age and sops for secrets management)
RUN --mount=target=/var/lib/apt/lists,type=cache,sharing=locked \
    --mount=target=/var/cache/apt,type=cache,sharing=locked \
    apt-get update -qq && \
    apt-get install --no-install-recommends -y libvips gettext age && \
    curl -LO https://github.com/getsops/sops/releases/download/v${SOPS_VERSION}/sops_${SOPS_VERSION}_${TARGETARCH}.deb && \
    dpkg -i sops_${SOPS_VERSION}_${TARGETARCH}.deb && \
    rm sops_${SOPS_VERSION}_${TARGETARCH}.deb

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
COPY --from=build /rails/micro-services/blocknote-converter/build ./micro-services/blocknote-converter/build
COPY --from=build /rails/micro-services/blocknote-converter/node_modules ./micro-services/blocknote-converter/node_modules

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

FROM packaged AS e2e

ENV DATABASE_CLEANER_ALLOW_REMOTE_DATABASE_URL=true
ENV VITE_RUBY_AUTO_BUILD=false

COPY --from=build /rails/spec/e2e ./spec/e2e
COPY --from=build /rails/spec/fixtures ./spec/fixtures

RUN echo "RAILS_ENV is $RAILS_ENV"

# Publish production as the default layer
FROM packaged AS production

