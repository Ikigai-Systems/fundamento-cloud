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
import "~/turbo/turbo_reload_turbo_frame.js"

import * as ActiveStorage from '@rails/activestorage'
ActiveStorage.start()

import "~/stimulus"

// // Import all channels.
// const channels = import.meta.globEager('./**/*_channel.js')

// Example: Import a stylesheet in app/frontend/index.css
// import '~/index.css'

import * as Sentry from "@sentry/react";

if (window.FundamentoConfig.sentryDsn) {
  Sentry.init({
    dsn: window.FundamentoConfig.sentryDsn,
    integrations: [
      Sentry.replayIntegration(),
    ],
    // Session Replay
    replaysSessionSampleRate: (typeof window.FundamentoConfig.replaysSessionSampleRate !== "undefined") ? window.FundamentoConfig.replaysSessionSampleRate : 0.1,
    // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
    replaysOnErrorSampleRate: 1.0,
  });
}

import Plausible from 'plausible-tracker';

// Dummy plausible function so we can still call it even if Plausible was not initialized
window.plausible = window.plausible || function () {
  (window.plausible.q = window.plausible.q || []).push(arguments)
};

if (window.FundamentoConfig.plausibleDomain) {
  const {trackPageview} = Plausible({
    domain: window.FundamentoConfig.plausibleDomain,
    trackLocalhost: true,
  });

  document.addEventListener("turbo:load", () => {
    trackPageview();
  });
}