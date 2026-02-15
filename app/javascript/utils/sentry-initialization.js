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
