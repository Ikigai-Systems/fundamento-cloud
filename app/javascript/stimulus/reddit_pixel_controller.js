import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { id: String }

  connect() {
    if (!this.idValue || !window.posthog) return;

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
    this.loadPixel();
  }

  loadPixel() {
    !function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);

    window.rdt('init', this.idValue, { optOut: false, useDecimalCurrencyValues: true });
    window.rdt('track', 'PageVisit');
  }
}
