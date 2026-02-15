import posthog from "posthog-js";

if (window.FundamentoConfig.posthogKey) {
  // Parse cross-domain bootstrap params from URL hash
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const bootstrapDistinctId = hashParams.get("distinct_id");
  const bootstrapSessionId = hashParams.get("session_id");

  const posthogConfig = {
    api_host: "/ingest",
    ui_host: "https://eu.posthog.com",
    capture_pageview: false,
    capture_pageleave: true,
    defaults: "2026-01-30",
    person_profiles: "always",
    cookieless_mode: "on_reject",
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "[data-ph-mask]",
    },
    autocapture: {
      dom_event_allowlist: ["click", "change", "submit"],
      url_allowlist: [window.location.origin],
      element_allowlist: ["a", "button", "form", "input", "select", "textarea"],
      css_selector_allowlist: ["[ph-autocapture]"],
    },
    capture_exceptions: true,
    capture_performance: true,
  };

  if (bootstrapDistinctId || bootstrapSessionId) {
    posthogConfig.bootstrap = {};
    if (bootstrapDistinctId) posthogConfig.bootstrap.distinctID = bootstrapDistinctId;
    if (bootstrapSessionId) posthogConfig.bootstrap.sessionID = bootstrapSessionId;
  }

  posthog.init(window.FundamentoConfig.posthogKey, posthogConfig);

  // Clean hash params from URL
  if (bootstrapDistinctId || bootstrapSessionId) {
    hashParams.delete("distinct_id");
    hashParams.delete("session_id");
    const remainingHash = hashParams.toString();
    const newUrl = window.location.pathname + window.location.search + (remainingHash ? "#" + remainingHash : "");
    history.replaceState(null, "", newUrl);
  }

  // Identify logged-in user
  if (window.FundamentoConfig.currentUserId) {
    posthog.identify(window.FundamentoConfig.currentUserId, {
      email: window.FundamentoConfig.currentUserEmail,
    });
  }

  // Track pageviews on Turbo navigation
  document.addEventListener("turbo:load", () => {
    posthog.capture("$pageview", { $current_url: window.location.href });
  });

  window.posthog = posthog;
}
