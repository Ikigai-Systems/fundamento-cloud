// To see this message, add the following to the `<head>` section in your
// views/layouts/application.html.erb
//
//    <%= vite_client_tag %>
//    <%= vite_javascript_tag 'application' %>
console.log('Vite ⚡️ Rails')

// If using a TypeScript entrypoint file:
//     <%= vite_typescript_tag 'application' %>
//
// If you want to use .jsx or .tsx, add the extension:
//     <%= vite_javascript_tag 'application.jsx' %>

console.log('Visit the guide for more information: ', 'https://vite-ruby.netlify.app/guide/rails')

// Example: Load Rails libraries in Vite.

import '@hotwired/turbo-rails'
Turbo.start()

import "~/turbo/turbo_keep_scroll.js"
import "~/turbo/turbo_redirect_to.js"

import * as ActiveStorage from '@rails/activestorage'
ActiveStorage.start()

import "~/stimulus"

// // Import all channels.
// const channels = import.meta.globEager('./**/*_channel.js')

// Example: Import a stylesheet in app/frontend/index.css
// import '~/index.css'

import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://0c7463b60827173872eb7d3bc8a9f8e5@o4507769834373120.ingest.de.sentry.io/4508331149951056",
  integrations: [
    Sentry.replayIntegration(),
  ],
  // Session Replay
  // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysSessionSampleRate: 0.1,
  // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  replaysOnErrorSampleRate: 1.0,
});
