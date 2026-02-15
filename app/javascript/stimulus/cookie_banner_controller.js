import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    if (!window.posthog || !window.FundamentoConfig.posthogKey) {
      return;
    }

    const status = window.posthog.get_explicit_consent_status();
    if (status === "pending") {
      this.element.removeAttribute("hidden");
    }
  }

  accept() {
    window.posthog.opt_in_capturing();
    this.element.setAttribute("hidden", "");
    document.dispatchEvent(new CustomEvent("consent:changed", { detail: { status: "granted" } }));
  }

  decline() {
    window.posthog.opt_out_capturing();
    this.element.setAttribute("hidden", "");
    document.dispatchEvent(new CustomEvent("consent:changed", { detail: { status: "denied" } }));
  }
}
