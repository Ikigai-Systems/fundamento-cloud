# syntax = docker/dockerfile:1

ARG NODE_VERSION=22

FROM registry.docker.com/library/node:$NODE_VERSION-slim AS base

RUN --mount=target=/var/lib/apt/lists,type=cache,sharing=locked \
    --mount=target=/var/cache/apt,type=cache,sharing=locked \
    rm -f /etc/apt/apt.conf.d/docker-clean && \
    apt-get update -qq && \
    apt-get install --no-install-recommends -y curl

# Rails app lives here
WORKDIR /app

# Throw-away build stage to reduce size of final image
FROM base AS build

COPY package.json package-lock.json ./
RUN --mount=type=cache,sharing=locked,target=/var/cache/npm \
    npm ci --cache /var/cache/npm

# Copy application code
COPY . .

ENV HTTP_HOST=0.0.0.0

EXPOSE 3001

CMD ["node", "src/server.js"]