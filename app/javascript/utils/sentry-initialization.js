import * as Sentry from "@sentry/react";

if (window.FundamentoConfig.sentryDsn) {
  Sentry.init({
    dsn: window.FundamentoConfig.sentryDsn,
    integrations: [
      Sentry.replayIntegration(),
    ],
    // Capture session replays for all errors
    replaysOnErrorSampleRate: 1.0,
  });
}
