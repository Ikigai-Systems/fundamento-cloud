import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { siteId: String, userName: String, userEmail: String, userHash: String }

  connect() {
    if (!this.siteIdValue || !window.posthog) return;

    this.loaded = false;
    this.boundOnConsentChange = this.onConsentChange.bind(this);
    document.addEventListener("consent:changed", this.boundOnConsentChange);

    this.checkConsentAndLoad();
  }

  disconnect() {
    if (this.boundOnConsentChange) {
      document.removeEventListener("consent:changed", this.boundOnConsentChange);
    }
  }

  onConsentChange() {
    this.checkConsentAndLoad();
  }

  checkConsentAndLoad() {
    if (this.loaded) return;
    if (!window.posthog || window.posthog.get_explicit_consent_status() !== "granted") return;

    this.loaded = true;
    this.loadTawk();
  }

  loadTawk() {
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://embed.tawk.to/" + this.siteIdValue;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");
    document.head.appendChild(script);

    if (this.userEmailValue) {
      window.Tawk_API.onLoad = () => {
        window.Tawk_API.setAttributes({
          name: this.userNameValue,
          email: this.userEmailValue,
          hash: this.userHashValue,
        }, function () {});
      };
    }
  }
}
